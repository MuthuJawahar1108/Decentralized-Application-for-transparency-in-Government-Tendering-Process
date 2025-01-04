// IssueReport.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import Tender from '../contractJson/Tender_Milestone.json';
import './IssueReport.css';


// EXAMPLE IPFS utility (you can replace with your own or a library)
async function uploadToIPFS(file) {
  // For a real project, you might use ipfs-http-client or an API
  // that returns the CID (hash). 
  // This is just a placeholder:
  const dummyHash = "QmDummyHashFor_" + file.name;
  return dummyHash;
}

const IssueReport = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tenderId = searchParams.get('tenderId');
  const milestoneIndex = searchParams.get('milestoneIndex');
  const milestoneNumString = (Number(milestoneIndex)+1).toString();
  const userAddress = searchParams.get('address');

  const [shortDesc, setShortDesc] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [docFile, setDocFile] = useState(null);

//   const contractAddress = "0xDF58aaFEc63F72E3133E81fa77b72470D5f76506";
  const contractAddress = '0x9b02ecDa729Ce39635682a882355Bb74E0cc375f'; // Replace with your deployed contract address
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  // Initialize contract from MetaMask
  useEffect(() => {
    const setup = async () => {
      if (!window.ethereum) {
        alert("MetaMask not found");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const c = new ethers.Contract(contractAddress, Tender.abi, signer);
      setContract(c);

      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    };
    setup();
  }, []);

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contract) {
      alert("Contract not ready yet");
      return;
    }
    if (!shortDesc) {
      alert("Please enter a short description for the issue");
      return;
    }
    if (!imageFile || !docFile) {
      alert("You must attach one image and one document");
      return;
    }

    try {
      // 1) Upload files to IPFS or your storage
      const imageHash = await uploadToIPFS(imageFile);
      const docHash = await uploadToIPFS(docFile);

      // 2) Call reportMilestoneIssue on the contract
      const tx = await contract.reportMilestoneIssue(
        tenderId,
        milestoneIndex,
        shortDesc,
        imageHash,
        docHash
      );
      await tx.wait();

      alert("Issue reported successfully!");
      // Optionally navigate back to MilestoneManagement
      navigate(`/milestones?tenderId=${tenderId}&address=${userAddress}`);
    } catch (error) {
      console.error("Error reporting issue:", error);
      alert("Failed to report issue");
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Report Issue for Milestone {milestoneNumString}</h1>
      <p>Tender ID: {tenderId}</p>
      <p>Reporter: {account}</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Description: </label>
          <textarea
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            rows={4}
          />
        </div>
        <div>
          <label>Upload Image: </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
          />
        </div>
        <div>
          <label>Upload Document: </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => setDocFile(e.target.files[0])}
          />
        </div>
        <button type="submit">Submit Issue</button>
      </form>
    </div>
  );
};

export default IssueReport;
