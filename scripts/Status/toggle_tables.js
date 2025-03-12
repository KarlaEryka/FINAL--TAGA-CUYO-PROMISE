function toggleTables() {
    const pendingTable = document.getElementById('pendingContentTable');
    const historyTable = document.getElementById('historyTable');
    const showPendingTableBtn = document.getElementById('showPendingTableBtn');
    const showHistoryTableBtn = document.getElementById('showHistoryTableBtn');

    // Ensure elements exist before adding event listeners
    if (!pendingTable || !historyTable || !showPendingTableBtn || !showHistoryTableBtn) {
        console.error("One or more elements not found.");
        return;
    }

    // Initially, show the Pending table and hide the History table
    pendingTable.style.display = 'table';
    historyTable.style.display = 'none';

    // Show Pending Table and hide History Table
    showPendingTableBtn.addEventListener('click', () => {
        pendingTable.style.display = 'table';  // Use 'table' instead of 'block'
        historyTable.style.display = 'none';
        showPendingTableBtn.classList.add('active');
        showHistoryTableBtn.classList.remove('active');
    });

    // Show History Table and hide Pending Table
    showHistoryTableBtn.addEventListener('click', () => {
        pendingTable.style.display = 'none';
        historyTable.style.display = 'table'; // Use 'table' instead of 'block'
        showHistoryTableBtn.classList.add('active');
        showPendingTableBtn.classList.remove('active');
    });
}

// Call the function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', toggleTables);
