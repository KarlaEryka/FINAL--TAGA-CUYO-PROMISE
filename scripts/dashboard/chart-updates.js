import { collection, getDocs, query, orderBy, limit,doc,getDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { db } from './firebase-config.js'; // Import db from firebaseconfig.js
import { initializeApp } from './firebase-config.js';

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { onAuthStateChanged } from './dashboard.js';
// Declare chart instances globally
let ageGroupChartInstance;
let languagePreferenceChartInstance;

async function fetchUserData() {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const ageGroups = { '0-18': 0, '19-30': 0, '31-45': 0, '46-60': 0, '60+': 0 };
    const languageCount = { 'Cuyonon': 0, 'Tagalog': 0, 'Other': 0 };

    snapshot.forEach(doc => {
        const userData = doc.data();
        const age = userData.age;
        const language = userData.language;

        // Update age groups
        if (age <= 18) {
            ageGroups['0-18']++;
        } else if (age <= 30) {
            ageGroups['19-30']++;
        } else if (age <= 45) {
            ageGroups['31-45']++;
        } else if (age <= 60) {
            ageGroups['46-60']++;
        } else {
            ageGroups['60+']++;
        }

        // Update language preferences
        if (language === 'Cuyonon') {
            languageCount['Cuyonon']++;
        } else if (language === 'Tagalog') {
            languageCount['Tagalog']++;
        } else {
            languageCount['Other']++;
        }
    });

    return { ageGroups, languageCount };
}

async function updateCharts() {
    const { ageGroups, languageCount } = await fetchUserData();

    // Update the age group chart
    updateAgeGroupChart(ageGroups);

    // Update the language preference chart
    updateLanguagePreferenceChart(languageCount);
}

// Call this function after DOM content is loaded
document.addEventListener('DOMContentLoaded', updateCharts);

// Function to update age group chart
function updateAgeGroupChart(ageGroups) {
    const ctx = document.getElementById('doughnutChart').getContext('2d');
    const ageLabels = Object.keys(ageGroups);
    const ageData = Object.values(ageGroups);

    // Check if the chart instance exists and destroy it before creating a new one
    if (ageGroupChartInstance) {
        ageGroupChartInstance.destroy();
    }

    // Create a new chart instance
    ageGroupChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ageLabels,
            datasets: [{
                label: 'Age Distribution',
                data: ageData,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Age Group Distribution' }
            }
        }
    });
}

// Function to update language preference chart
function updateLanguagePreferenceChart(languageCount) {
    const ctx = document.getElementById('barChart').getContext('2d');
    const labels = Object.keys(languageCount);
    const data = Object.values(languageCount);

    // Check if the chart instance exists and destroy it before creating a new one
    if (languagePreferenceChartInstance) {
        languagePreferenceChartInstance.destroy();
    }

    // Create a new chart instance
    const backgroundColors = labels.map(label => {
        if (label === 'Cuyonon') return 'rgba(255, 205, 86, 0.7)';
        if (label === 'Tagalog') return 'rgba(75, 192, 192, 0.7)';
        return 'rgba(54, 162, 235, 0.7)';
    });

    languagePreferenceChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace(/0.7/, '1')),
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: { display: false },
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Monthly user data and line chart setup can remain the same
async function fetchMonthlyUsers() {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const monthlyUserCounts = {};

    snapshot.forEach(doc => {
        const userData = doc.data();
        const dateJoined = userData.createdAt;

        if (dateJoined) {
            let jsDate;

            // Check if dateJoined is a Firestore Timestamp or a string
            if (typeof dateJoined.toDate === 'function') {
                jsDate = dateJoined.toDate(); // Convert Firestore Timestamp to JS Date
            } else {
                jsDate = new Date(dateJoined); // Parse as string
            }

            // Validate the resulting Date object
            if (!isNaN(jsDate.getTime())) {
                const month = jsDate.getMonth() + 1; // Get month (1-12)
                const year = jsDate.getFullYear(); // Get year
                const monthYear = `${year}-${month.toString().padStart(2, '0')}`;

                // Increment the count for the corresponding month-year
                monthlyUserCounts[monthYear] = (monthlyUserCounts[monthYear] || 0) + 1;
            } else {
                console.warn(`Invalid date format for document ${doc.id}: ${dateJoined}`);
            }
        } else {
            console.warn(`Missing 'createdAt' for document ${doc.id}`);
        }
    });

    return monthlyUserCounts;
}

async function setupLineChart() {
    const monthlyUserCounts = await fetchMonthlyUsers();

    // Sort the months (keys) in YYYY-MM format
    const labels = Object.keys(monthlyUserCounts).sort();

    // Convert YYYY-MM into a human-readable format like 'Month Year'
    const readableLabels = labels.map(label => {
        const [year, month] = label.split('-');
        const date = new Date(year, month - 1); // Create a date object
        return date.toLocaleString('default', { month: 'long', year: 'numeric' }); // Format: 'Month Year'
    });

    // Data for the chart
    const data = labels.map(label => monthlyUserCounts[label]);

    const ctx = document.getElementById('lineChart').getContext('2d');
    const lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: readableLabels,
            datasets: [{
                label: 'Number of Users',
                data: data,
                borderColor: 'rgba(25, 118, 210, 1)', // Line color
                backgroundColor: 'rgba(25, 118, 210, 0.2)', // Fill under line
                borderWidth: 2,
                fill: true,
            }],

        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month and Year', // Label for X-axis
                    },
                },
                y: {
                    beginAtZero: true, // Start Y-axis at zero
                    title: {
                        display: true,
                        text: 'Number of Users', // Label for Y-axis
                    },
                },
            },
        },
    });
}

// Call setupLineChart when the document is loaded
document.addEventListener('DOMContentLoaded', setupLineChart);
