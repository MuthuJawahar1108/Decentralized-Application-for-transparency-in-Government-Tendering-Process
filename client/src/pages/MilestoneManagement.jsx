//--------------------------

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useSearchParams } from 'react-router-dom';
import Tender from '../contractJson/Tender_Milestone.json';

const TenderABI = Tender.abi;

function MilestoneManagement() {
  const [searchParams] = useSearchParams();
  const tenderId = searchParams.get('tenderId');
  const userAddress = searchParams.get('address');
  // isWinner passed as a *hint* for the UI
  const isWinnerQueryParam = searchParams.get('isWinner') === 'true';

  // Basic states
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  // We'll store tender data (including the real on-chain winner)
  const [tenderData, setTenderData] = useState({
    id: 0,
    description: '',
    minBidAmount: 0,
    isOpen: false,
    winner: '',
    estimateCost: 0,
    finalCost: 0
  });

  // We'll keep the final "isWinner" logic here (after on-chain check)
  const [isRealWinner, setIsRealWinner] = useState(false);

  // For milestones
  const [milestones, setMilestones] = useState([]);

  // For adding a milestone
  const [milestoneDesc, setMilestoneDesc] = useState('');
  const [milestoneAmount, setMilestoneAmount] = useState(0);

  // Constants
  const contractAddress = '0xDF58aaFEc63F72E3133E81fa77b72470D5f76506'; // Replace with your deployed contract address
  const governmentOfficial = "0x7CbF50988586a13463E1f93B5d5F8bc523F49d10";

  // 1) On mount, set up contract & account
  useEffect(() => {
    const setupContract = async () => {
      if (!window.ethereum) {
        alert('MetaMask not detected!');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const deployedContract = new ethers.Contract(contractAddress, TenderABI, signer);
      setContract(deployedContract);

      // If userAddress wasn't in the query param, prompt for accounts
      if (!userAddress) {
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
      } else {
        setAccount(userAddress);
      }
    };

    setupContract();

    // Listen for account switching
    const handleAccountChange = (accounts) => {
      setAccount(accounts[0]);
    };
    window.ethereum?.on('accountsChanged', handleAccountChange);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountChange);
    };
  }, [userAddress]);

  // 2) Once we have both contract & tenderId, load tender details
  useEffect(() => {
    if (!contract || !tenderId) return;

    const loadTenderDetails = async () => {
      const details = await contract.getTenderDetails(tenderId);
      // struct TenderDetails {
      //   uint id;             // index 0
      //   string description;  // index 1
      //   uint minBidAmount;   // index 2
      //   bool isOpen;         // index 3
      //   address winner;      // index 4
      //   uint estimateCost;   // index 5
      //   uint finalCost;      // index 6
      // }
      const updatedTenderData = {
        id: Number(details[0]),
        description: details[1],
        minBidAmount: Number(ethers.formatUnits(details[2], 'wei')),
        isOpen: details[3],
        winner: details[4],
        estimateCost: Number(ethers.formatUnits(details[5], 'wei')),
        finalCost: Number(ethers.formatUnits(details[6], 'wei'))
      };
      setTenderData(updatedTenderData);

      // Now fetch the Milestone[] array
      const milestoneList = await contract.getMilestones(tenderId);
      const mappedMilestones = milestoneList.map((m, idx) => ({
        id: idx + 1,
        description: m[0],
        fundRequested: m[1],
        isApproved: m[2]
      }));
      setMilestones(mappedMilestones);
    };

    loadTenderDetails();
  }, [contract, tenderId]);

  // 3) Once we have account & tenderData, verify if user is the real winner
  useEffect(() => {
    if (!account || !tenderData.winner) return;

    // We do a real check: on-chain winner vs. connected user
    const isActualWinner = 
      account.toLowerCase() === tenderData.winner.toLowerCase() &&
      tenderData.winner !== ethers.ZeroAddress;

    setIsRealWinner(isActualWinner);
  }, [account, tenderData]);




    /**
   * Helper: sumOfMilestonesSoFar
   * Sums the fundRequested (in wei) of ALL milestones, whether approved or not
   */
    const sumOfMilestonesSoFar = milestones.reduce((acc, milestone) => {
      // milestone.fundRequested is a BigInt or hex value
      const requestedNum = Number(ethers.formatUnits(milestone.fundRequested, 'wei'));
      return acc + requestedNum;
    }, 0);
  
    /**
     * Remaining funds in finalCost
     * finalCost - sumOfMilestonesSoFar
     */
    const remainingBudget = tenderData.finalCost - sumOfMilestonesSoFar;
    console.log("remainingBudget: ",remainingBudget);
    console.log("sumOfMilestonesSoFar: ",sumOfMilestonesSoFar);








  // 4) Add Milestone
  const addMilestone = async () => {
    if (!contract) return;

    // We can optionally confirm user is the real on-chain winner in code too
    if (!isRealWinner) {
      alert('You must be the actual winner on chain to add a milestone!');
      return;
    }

    if (!milestoneDesc || milestoneAmount <= 0) {
      alert('Please enter a milestone description and valid amount.');
      return;
    }

    // 1) Check if new sum would exceed finalCost
    const newSum = sumOfMilestonesSoFar + milestoneAmount;
    if (newSum > tenderData.finalCost) {
      alert(
        `Cannot create milestone. Total requested (${newSum} wei) would exceed final cost (${tenderData.finalCost} wei).`
      );
      return;
    }
       // 2) Confirmation
       if (!window.confirm(`Are you sure you want to create a milestone requesting ${milestoneAmount} wei?`)) {
        return;
      }

    const tx = await contract.addMilestone(
      tenderId,
      milestoneDesc,
      ethers.parseUnits(milestoneAmount.toString(), 'wei')
    );
    await tx.wait();

    alert('Milestone added successfully!');
    setMilestoneDesc('');
    setMilestoneAmount(0);

    // Re-fetch milestones
    const milestoneList = await contract.getMilestones(tenderId);
    const mapped = milestoneList.map((m, idx) => ({
      id: idx + 1,
      description: m[0],
      fundRequested: m[1],
      isApproved: m[2]
    }));
    setMilestones(mapped);
  };

  // 5) For the official to approve a milestone
  const approveMilestone = async (index) => {
    if (!contract) return;

    // Only the official can approve
    if (account.toLowerCase() !== governmentOfficial.toLowerCase()) {
      alert('Only government official can approve milestone!');
      return;
    }


    // Confirm
    if (!window.confirm(`Are you sure you want to approve Milestone #${index + 1}?`)) {
      return;
    }

    // The contract expects "milestoneIndex", which is 0-based
    const tx = await contract.approveMilestone(tenderId, index);
    await tx.wait();

    alert(`Milestone #${index + 1} approved!`);

    // Update state in memory
    setMilestones((prev) => {
      const updated = [...prev];
      updated[index].isApproved = true;
      return updated;
    });
  };

  /** 
   * For display logic: 
   * - isWinnerQueryParam = "passed in URL", might be inaccurate if user tampered
   * - isRealWinner = "true on chain", so definitely the real winner
   */
  const canAddMilestone = isWinnerQueryParam && isRealWinner;

  return (
    <div className="App">
      <h1>Milestone Management</h1>
      <p><strong>Connected account:</strong> {account}</p>

       <div style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
        <h2>Tender Details</h2>
        <p><strong>ID:</strong> {tenderData.id}</p>
        <p><strong>Description:</strong> {tenderData.description}</p>
        <p><strong>Final Cost:</strong> {tenderData.finalCost} wei</p>
        <p><strong>Sum of All Milestones So Far:</strong> {sumOfMilestonesSoFar} wei</p>
        <p><strong>Remaining Budget:</strong> {remainingBudget} wei</p>
        <p><strong>Winner:</strong> {tenderData.winner === ethers.ZeroAddress 
          ? 'No winner yet' 
          : tenderData.winner}
        </p>
      </div>

      {/** If user is the real winner (per contract), show "Add Milestone" panel */}
      {canAddMilestone && (
        <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '1rem' }}>
          <h2>Add Milestone</h2>
          <input
            type="text"
            placeholder="Milestone Description"
            value={milestoneDesc}
            onChange={(e) => setMilestoneDesc(e.target.value)}
          />
          <input
            type="number"
            placeholder="Fund Requested (wei)"
            value={milestoneAmount}
            onChange={(e) => setMilestoneAmount(Number(e.target.value))}
          />
          <button onClick={addMilestone}>Add Milestone</button>
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <h2>Milestones</h2>
        {milestones.map((m, idx) => (
          <div
            key={idx}
            style={{ border: '1px solid #eee', padding: '0.5rem', marginBottom: '0.5rem' }}
          >
            <p><strong># {m.id}</strong></p>
            <p><strong>Description:</strong> {m.description}</p>
            <p><strong>Fund Requested:</strong> {ethers.formatUnits(m.fundRequested, 'wei')} wei</p>
            <p><strong>Approved?</strong> {m.isApproved ? 'Yes' : 'No'}</p>

            {account && account.toLowerCase() === governmentOfficial.toLowerCase() && !m.isApproved && (
              <button onClick={() => approveMilestone(idx)}>Approve</button>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <p>isWinner (from URL): {String(isWinnerQueryParam)}</p>
        <p>isRealWinner (on-chain check): {String(isRealWinner)}</p>
      </div>
    </div>
  );
}

export default MilestoneManagement;
