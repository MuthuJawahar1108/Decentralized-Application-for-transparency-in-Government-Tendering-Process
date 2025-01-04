import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TenderManagement from './pages/TenderManagement.jsx';
import MilestoneManagement from './pages/MilestoneManagement.jsx';
import IssueReport from './pages/IssueReport.jsx';


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<TenderManagement />} />
                <Route path="/milestones" element={<MilestoneManagement />} />
                <Route path="/reportIssue" element={<IssueReport />} />
            </Routes>
        </Router>
    );
}

export default App;