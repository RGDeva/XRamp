// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title XRampEscrow
 * @notice Minimal escrow for XRamp P2P on/off-ramp flows.
 *
 * Flow:
 *   1. createEscrow(token, amount, payer, payee)  → escrowId   (anyone)
 *   2. deposit(escrowId)                          → transferFrom payer → contract  (payer)
 *   3. release(escrowId)                          → transfer to payee  (arbiter only)
 *   4. cancel(escrowId)                           → refund to payer    (arbiter only)
 *
 * The arbiter is set at deployment time and is the backend signer.
 */
contract XRampEscrow {
    using SafeERC20 for IERC20;

    enum State { CREATED, FUNDED, RELEASED, CANCELED }

    struct Escrow {
        address token;
        uint256 amount;
        address payer;
        address payee;
        address arbiter;
        State   state;
    }

    uint256 public nextEscrowId;
    address public arbiter;
    mapping(uint256 => Escrow) public escrows;

    event EscrowCreated(uint256 indexed escrowId, address token, uint256 amount, address payer, address payee);
    event EscrowFunded(uint256 indexed escrowId, address payer, uint256 amount);
    event EscrowReleased(uint256 indexed escrowId, address payee, uint256 amount);
    event EscrowCanceled(uint256 indexed escrowId, address payer, uint256 amount);

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Only arbiter");
        _;
    }

    constructor(address _arbiter) {
        arbiter = _arbiter;
    }

    function createEscrow(
        address token,
        uint256 amount,
        address payer,
        address payee
    ) external returns (uint256 escrowId) {
        require(amount > 0, "Amount must be > 0");
        escrowId = nextEscrowId++;
        escrows[escrowId] = Escrow({
            token: token,
            amount: amount,
            payer: payer,
            payee: payee,
            arbiter: arbiter,
            state: State.CREATED
        });
        emit EscrowCreated(escrowId, token, amount, payer, payee);
    }

    function deposit(uint256 escrowId) external {
        Escrow storage e = escrows[escrowId];
        require(e.state == State.CREATED, "Not in CREATED state");
        require(msg.sender == e.payer, "Only payer can deposit");

        IERC20(e.token).safeTransferFrom(e.payer, address(this), e.amount);
        e.state = State.FUNDED;
        emit EscrowFunded(escrowId, e.payer, e.amount);
    }

    function release(uint256 escrowId) external onlyArbiter {
        Escrow storage e = escrows[escrowId];
        require(e.state == State.FUNDED, "Not in FUNDED state");

        e.state = State.RELEASED;
        IERC20(e.token).safeTransfer(e.payee, e.amount);
        emit EscrowReleased(escrowId, e.payee, e.amount);
    }

    function cancel(uint256 escrowId) external onlyArbiter {
        Escrow storage e = escrows[escrowId];
        require(e.state == State.FUNDED, "Not in FUNDED state");

        e.state = State.CANCELED;
        IERC20(e.token).safeTransfer(e.payer, e.amount);
        emit EscrowCanceled(escrowId, e.payer, e.amount);
    }
}
