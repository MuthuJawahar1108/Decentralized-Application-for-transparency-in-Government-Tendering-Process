// // SPDX-License-Identifier: MIT

//-----------------------------------
pragma solidity ^0.8.27;

contract Tender_Milestone {
    struct TenderDetails {
        uint id;
        string description;
        uint minBidAmount;
        bool isOpen;
        address winner;
        uint estimateCost; // Added estimated cost
        uint finalCost; // Added final cost
    }

    struct Bid {
        uint tenderId;
        address bidder;
        uint bidAmount;
        uint estimatedCost; // Bidder's estimated cost
    }

    struct Milestone {
        string description; // Milestone description
        uint fundRequested; // Amount of funds requested
        bool isApproved; // Whether the milestone is approved
    }

    // Updated Issue struct to store two IPFS references
    struct Issue {
        address reporter;
        string description; // A short text summary of the issue
        string imageHash; // IPFS CID for the image
        string docHash; // IPFS CID for the document
        uint timestamp;
    }

    uint public tenderCounter;
    mapping(uint => TenderDetails) public tenders;
    mapping(uint => Bid[]) public bids;
    mapping(uint => Milestone[]) public milestones; // Milestones for each tender

    // milestoneIssues[tenderId][milestoneIndex] -> array of issues
    mapping(uint => mapping(uint => Issue[])) public milestoneIssues;

    address public governmentOfficial;

    constructor() {
        governmentOfficial = msg.sender;
    }

    modifier onlyGovernmentOfficial() {
        require(
            msg.sender == governmentOfficial,
            "Only government officials can perform this action"
        );
        _;
    }

    modifier onlyWinner(uint tenderId) {
        require(
            msg.sender == tenders[tenderId].winner,
            "Only the winning bidder can perform this action"
        );
        _;
    }

    function createTender(
        string memory description,
        uint minBidAmount
    ) public onlyGovernmentOfficial {
        tenderCounter++;
        tenders[tenderCounter] = TenderDetails(
            tenderCounter,
            description,
            minBidAmount,
            true,
            address(0),
            0,
            0 // Final cost not set initially
        );
    }

    function submitBid(
        uint tenderId,
        uint bidAmount,
        uint estimatedCost
    ) public {
        require(tenders[tenderId].isOpen, "Tender is closed");
        require(
            bidAmount >= tenders[tenderId].minBidAmount,
            "Bid amount is too low"
        );
        require(
            estimatedCost >= bidAmount,
            "Estimated cost should be greater than or equal to the bid amount"
        );

        bids[tenderId].push(
            Bid(tenderId, msg.sender, bidAmount, estimatedCost)
        );
    }

    function getTenderDetails(
        uint tenderId
    ) public view returns (TenderDetails memory) {
        return tenders[tenderId];
    }

    function getBids(uint tenderId) public view returns (Bid[] memory) {
        return bids[tenderId];
    }

    function chooseWinner(
        uint tenderId,
        address winnerAddress,
        uint finalCost
    ) public onlyGovernmentOfficial {
        require(tenders[tenderId].isOpen, "Tender is already closed");

        bool validBidder = false;
        uint winnerEstimateCost;

        // Check if the selected address is a valid bidder and get their estimated cost
        for (uint i = 0; i < bids[tenderId].length; i++) {
            if (bids[tenderId][i].bidder == winnerAddress) {
                validBidder = true;
                winnerEstimateCost = bids[tenderId][i].estimatedCost;
                break;
            }
        }

        require(validBidder, "Selected address is not a valid bidder");

        require(
            finalCost <= winnerEstimateCost,
            "Final cost must be less than or equal to the winner's estimated cost"
        );
        // Assign winner and costs
        tenders[tenderId].winner = winnerAddress;
        tenders[tenderId].isOpen = false;
        tenders[tenderId].estimateCost = winnerEstimateCost;
        tenders[tenderId].finalCost = finalCost;
    }

    function addMilestone(
        uint tenderId,
        string memory description,
        uint fundRequested
    ) public onlyWinner(tenderId) {
        milestones[tenderId].push(Milestone(description, fundRequested, false));
    }

    function getMilestones(
        uint tenderId
    ) public view returns (Milestone[] memory) {
        return milestones[tenderId];
    }

    function approveMilestone(
        uint tenderId,
        uint milestoneIndex
    ) public onlyGovernmentOfficial {
        require(
            milestoneIndex < milestones[tenderId].length,
            "Invalid milestone index"
        );
        require(
            !milestones[tenderId][milestoneIndex].isApproved,
            "Milestone already approved"
        );

        milestones[tenderId][milestoneIndex].isApproved = true;
    }

    function reportMilestoneIssue(
        uint tenderId,
        uint milestoneIndex,
        string memory shortDescription,
        string memory imageHash,
        string memory docHash
    ) public {
        // (A) Make sure the milestoneIndex is valid
        require(
            milestoneIndex < milestones[tenderId].length,
            "Invalid milestone index"
        );

        // (B) Check that msg.sender is NOT the winner
        require(
            msg.sender != tenders[tenderId].winner,
            "Winner cannot report issues"
        );

        // (C) Basic check that the reporter provided IPFS references
        require(
            bytes(imageHash).length > 0 && bytes(docHash).length > 0,
            "Must provide one image and one document IPFS hash"
        );

        // Create the issue struct
        Issue memory newIssue = Issue({
            reporter: msg.sender,
            description: shortDescription,
            imageHash: imageHash,
            docHash: docHash,
            timestamp: block.timestamp
        });

        milestoneIssues[tenderId][milestoneIndex].push(newIssue);
    }

    // For retrieving the issues
    function getMilestoneIssues(
        uint tenderId,
        uint milestoneIndex
    ) public view returns (Issue[] memory) {
        return milestoneIssues[tenderId][milestoneIndex];
    }
}
