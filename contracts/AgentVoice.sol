// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AgentVoice — polls where one Agent ID equals one vote.
/// @notice Only addresses holding an Agent ID (SPACE ID .ai, ERC-721,
///         non-transferable, one per user) can create polls and vote.
///         One vote per address per poll. No funds are ever handled:
///         no payable functions, no owner, no withdrawals.
interface IAgentID {
    function balanceOf(address owner) external view returns (uint256);
}

contract AgentVoice {
    IAgentID public immutable agentId;
    uint256 public pollCount;

    struct Poll {
        address creator;
        string question;
        string[] options;
        uint256[] votes;
        uint256 endTime;
        bool exists;
    }

    mapping(uint256 => Poll) private polls;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint256)) public voteOf;

    event PollCreated(
        uint256 indexed pollId,
        address indexed creator,
        string question,
        uint256 optionCount,
        uint256 endTime
    );
    event Voted(uint256 indexed pollId, address indexed voter, uint256 indexed optionIndex);

    error NotAgentIdHolder();
    error PollNotFound();
    error PollEnded();
    error AlreadyVoted();
    error InvalidOption();
    error InvalidPoll();

    modifier onlyAgent() {
        if (agentId.balanceOf(msg.sender) == 0) revert NotAgentIdHolder();
        _;
    }

    constructor(address _agentId) {
        require(_agentId != address(0), "zero address");
        agentId = IAgentID(_agentId);
    }

    function createPoll(
        string calldata question,
        string[] calldata options,
        uint256 durationSeconds
    ) external onlyAgent returns (uint256 pollId) {
        if (bytes(question).length == 0 || bytes(question).length > 280) revert InvalidPoll();
        if (options.length < 2 || options.length > 6) revert InvalidPoll();
        if (durationSeconds < 1 hours || durationSeconds > 30 days) revert InvalidPoll();

        pollId = pollCount++;
        Poll storage p = polls[pollId];
        p.creator = msg.sender;
        p.question = question;
        // Push one by one: the old code generator cannot copy a calldata
        // string[] to storage in a single assignment.
        for (uint256 i = 0; i < options.length; i++) {
            if (bytes(options[i]).length == 0 || bytes(options[i]).length > 100) revert InvalidPoll();
            p.options.push(options[i]);
        }
        p.votes = new uint256[](options.length);
        p.endTime = block.timestamp + durationSeconds;
        p.exists = true;

        emit PollCreated(pollId, msg.sender, question, options.length, p.endTime);
    }

    function vote(uint256 pollId, uint256 optionIndex) external onlyAgent {
        Poll storage p = polls[pollId];
        if (!p.exists) revert PollNotFound();
        if (block.timestamp >= p.endTime) revert PollEnded();
        if (optionIndex >= p.options.length) revert InvalidOption();
        if (hasVoted[pollId][msg.sender]) revert AlreadyVoted();

        hasVoted[pollId][msg.sender] = true;
        voteOf[pollId][msg.sender] = optionIndex;
        p.votes[optionIndex] += 1;

        emit Voted(pollId, msg.sender, optionIndex);
    }

    function getPoll(
        uint256 pollId
    )
        external
        view
        returns (
            address creator,
            string memory question,
            string[] memory options,
            uint256[] memory votes,
            uint256 endTime,
            bool exists
        )
    {
        Poll storage p = polls[pollId];
        return (p.creator, p.question, p.options, p.votes, p.endTime, p.exists);
    }

    function totalVotes(uint256 pollId) external view returns (uint256 total) {
        Poll storage p = polls[pollId];
        for (uint256 i = 0; i < p.votes.length; i++) {
            total += p.votes[i];
        }
    }

    function isAgent(address account) external view returns (bool) {
        return agentId.balanceOf(account) > 0;
    }
}
