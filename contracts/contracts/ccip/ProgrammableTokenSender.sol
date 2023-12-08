// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.0/token/ERC20/IERC20.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";

/// @title ProgrammableTokenSender
abstract contract ProgrammableTokenSender is OwnerIsCreator {
  // Custom errors to provide more descriptive revert messages.
  error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees); // Used to make sure contract has enough balance to cover the fees.
  error NothingToWithdraw(); // Used when trying to withdraw Ether but there's nothing to withdraw.
  error FailedToWithdrawEth(address owner, address target, uint256 value); // Used when the withdrawal of Ether fails.
  error DestinationChainNotWhitelisted(uint64 destinationChainSelector); // Used when the destination chain has not been whitelisted by the contract owner.

  // Event emitted when a message is sent to another chain.
  event MessageSent(
    bytes32 indexed messageId, // The unique ID of the CCIP message.
    uint64 indexed destinationChainSelector, // The chain selector of the destination chain.
    address receiver, // The address of the receiver on the destination chain.
    bytes data, // The data being sent.
    address token, // The token address that was transferred.
    uint256 tokenAmount, // The token amount that was transferred.
    address feeToken, // the token address used to pay CCIP fees.
    uint256 fees // The fees paid for sending the message.
  );

  // Mapping to keep track of whitelisted destination chains.
  mapping(uint64 => bool) public whitelistedDestinationChains;

  IRouterClient private router;

  LinkTokenInterface linkToken;

  /// @notice Constructor initializes the contract with the router address.
  /// @param _router The address of the router contract.
  /// @param _link The address of the link contract.
  constructor(address _router, address _link) {
    router = IRouterClient(_router);
    linkToken = LinkTokenInterface(_link);
  }

  /// @dev Modifier that checks if the chain with the given destinationChainSelector is whitelisted.
  /// @param _destinationChainSelector The selector of the destination chain.
  modifier onlyWhitelistedDestinationChain(uint64 _destinationChainSelector) {
    if (!whitelistedDestinationChains[_destinationChainSelector])
      revert DestinationChainNotWhitelisted(_destinationChainSelector);
    _;
  }

  /// @dev Whitelists a chain for transactions.
  /// @notice This function can only be called by the owner.
  /// @param _destinationChainSelector The selector of the destination chain to be whitelisted.
  function whitelistDestinationChain(uint64 _destinationChainSelector) external onlyOwner {
    whitelistedDestinationChains[_destinationChainSelector] = true;
  }

  /// @dev Denylists a chain for transactions.
  /// @notice This function can only be called by the owner.
  /// @param _destinationChainSelector The selector of the destination chain to be denylisted.
  function denylistDestinationChain(uint64 _destinationChainSelector) external onlyOwner {
    whitelistedDestinationChains[_destinationChainSelector] = false;
  }

  /// @notice Sends data and transfer tokens to receiver on the destination chain.
  /// @notice Pay for fees in LINK.
  /// @dev Assumes your contract has sufficient LINK to pay for CCIP fees.
  /// @param _destinationChainSelector The identifier (aka selector) for the destination blockchain.
  /// @param _receiver The address of the recipient on the destination blockchain.
  /// @param _data The bytes data to be sent.
  /// @param _token token address.
  /// @param _amount token amount.
  /// @return messageId The ID of the CCIP message that was sent.
  function _sendMessagePayLINK(
    uint64 _destinationChainSelector,
    address _receiver,
    bytes memory _data,
    address _token,
    uint256 _amount
  ) internal onlyWhitelistedDestinationChain(_destinationChainSelector) returns (bytes32 messageId) {
    // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
    // address(linkToken) means fees are paid in LINK
    Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
      _receiver,
      _data,
      _token,
      _amount,
      address(linkToken)
    );

    // Get the fee required to send the CCIP message
    uint256 fees = router.getFee(_destinationChainSelector, evm2AnyMessage);

    if (fees > linkToken.balanceOf(address(this))) revert NotEnoughBalance(linkToken.balanceOf(address(this)), fees);

    // approve the Router to transfer LINK tokens on contract's behalf. It will spend the fees in LINK
    linkToken.approve(address(router), fees);

    // approve the Router to spend tokens on contract's behalf. It will spend the amount of the given token
    IERC20(_token).approve(address(router), _amount);

    // Send the message through the router and store the returned message ID
    messageId = router.ccipSend(_destinationChainSelector, evm2AnyMessage);

    // Emit an event with message details
    emit MessageSent(messageId, _destinationChainSelector, _receiver, _data, _token, _amount, address(linkToken), fees);

    // Return the message ID
    return messageId;
  }

  /// @notice Construct a CCIP message.
  /// @dev This function will create an EVM2AnyMessage struct with all the necessary information for programmable tokens transfer.
  /// @param _receiver The address of the receiver.
  /// @param _data The bytes data to be sent.
  /// @param _token The token to be transferred.
  /// @param _amount The amount of the token to be transferred.
  /// @param _feeTokenAddress The address of the token used for fees. Set address(0) for native gas.
  /// @return Client.EVM2AnyMessage Returns an EVM2AnyMessage struct which contains information for sending a CCIP message.
  function _buildCCIPMessage(
    address _receiver,
    bytes memory _data,
    address _token,
    uint256 _amount,
    address _feeTokenAddress
  ) internal pure returns (Client.EVM2AnyMessage memory) {
    // Set the token amounts
    Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
    Client.EVMTokenAmount memory tokenAmount = Client.EVMTokenAmount({token: _token, amount: _amount});
    tokenAmounts[0] = tokenAmount;
    // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
    Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
      receiver: abi.encode(_receiver), // ABI-encoded receiver address
      data: _data,
      tokenAmounts: tokenAmounts, // The amount and type of token being transferred
      extraArgs: Client._argsToBytes(
        // Additional arguments, setting gas limit and non-strict sequencing mode
        Client.EVMExtraArgsV1({gasLimit: 500_000, strict: false})
      ),
      // Set the feeToken to a feeTokenAddress, indicating specific asset will be used for fees
      feeToken: _feeTokenAddress
    });
    return evm2AnyMessage;
  }

  /// @notice Fallback function to allow the contract to receive Ether.
  /// @dev This function has no function body, making it a default function for receiving Ether.
  /// It is automatically called when Ether is sent to the contract without any data.
  receive() external payable {}

  /// @notice Allows the contract owner to withdraw the entire balance of Ether from the contract.
  /// @dev This function reverts if there are no funds to withdraw or if the transfer fails.
  /// It should only be callable by the owner of the contract.
  /// @param _beneficiary The address to which the Ether should be sent.
  function withdraw(address _beneficiary) public onlyOwner {
    // Retrieve the balance of this contract
    uint256 amount = address(this).balance;

    // Revert if there is nothing to withdraw
    if (amount == 0) revert NothingToWithdraw();

    // Attempt to send the funds, capturing the success status and discarding any return data
    (bool sent, ) = _beneficiary.call{value: amount}("");

    // Revert if the send failed, with information about the attempted transfer
    if (!sent) revert FailedToWithdrawEth(msg.sender, _beneficiary, amount);
  }

  /// @notice Allows the owner of the contract to withdraw all tokens of a specific ERC20 token.
  /// @dev This function reverts with a 'NothingToWithdraw' error if there are no tokens to withdraw.
  /// @param _beneficiary The address to which the tokens will be sent.
  /// @param _token The contract address of the ERC20 token to be withdrawn.
  function withdrawToken(address _beneficiary, address _token) public onlyOwner {
    // Retrieve the balance of this contract
    uint256 amount = IERC20(_token).balanceOf(address(this));

    // Revert if there is nothing to withdraw
    if (amount == 0) revert NothingToWithdraw();

    IERC20(_token).transfer(_beneficiary, amount);
  }
}
