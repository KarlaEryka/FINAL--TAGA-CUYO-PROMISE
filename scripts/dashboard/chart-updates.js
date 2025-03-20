import { collection, getDocs, query, orderBy, limit,doc,getDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { db } from './firebase-config.js'; // Import db from firebaseconfig.js
import { initializeApp,getAuth,app } from './firebase-config.js';
import { onAuthStateChanged } from './dashboard.js';
// Initialize Firebase Auth
const auth = getAuth(app); 
function enforceAccessControl(user) {
    if (!user) {
        // Redirect to login or show an access denied message
        window.location.href = "login.html"; 
    } else {
        console.log("User is logged in:", user);
    }
}

// Now, it can be used in the onAuthStateChanged function
onAuthStateChanged(auth, (user) => {
    enforceAccessControl(user);
});

// Declare chart instances globally
let ageGroupChartInstance;
let languagePreferenceChartInstance;
async function fetchMonthlyUsers() {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    const monthlyUserCounts = {};

    snapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.createdAt) { 
            const date = new Date(userData.createdAt);        
            const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            monthlyUserCounts[yearMonth] = (monthlyUserCounts[yearMonth] || 0) + 1;
        }
    });

    return monthlyUserCounts;
}

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

// Function to update the Age Group Chart with better aesthetics
function updateAgeGroupChart(ageGroups) {
    const ctx = document.getElementById('doughnutChart').getContext('2d');
    const ageLabels = Object.keys(ageGroups);
    const ageData = Object.values(ageGroups);

    if (ageGroupChartInstance) {
        ageGroupChartInstance.destroy();
    }

    ageGroupChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ageLabels,
            datasets: [{
                label: 'Age Distribution',
                data: ageData,
                backgroundColor: [
                    '#FC3A3AFF', // Red
                    '#4372E8FF', // Teal
                    '#F2EE2EFF', // Yellow
                    '#9A5BF1FF', // Purple
                    '#32EE74FF'  // Green
                ],
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 2,
                hoverOffset: 10, // Makes the hover effect stand out
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#333',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Age Group Distribution',
                    color: '#222',
                    font: {
                        size: 18,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    bodyFont: { size: 14 },
                    padding: 10
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeInOutQuad' // Smooth animation
            }
        }
    });
}

// Function to update the Language Preference Chart with better aesthetics
function updateLanguagePreferenceChart(languageCount) {
    const ctx = document.getElementById('barChart').getContext('2d');
    const labels = Object.keys(languageCount);
    const data = Object.values(languageCount);

    if (languagePreferenceChartInstance) {
        languagePreferenceChartInstance.destroy();
    }

    languagePreferenceChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#326CFFFF', // Red
                    '#FC3A3AFF', // Blue
                    '#F2EE2EFF'
                ],
                borderColor: [
                    '#EBEBE5FF',
                    '#EBEBE5FF',
                    '#EBEBE5FF'
                ],
                borderWidth: 2,
                borderRadius: 5, // Slightly rounded bars
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Language Preferences',
                    color: '#222',
                    font: { size: 18, weight: 'bold' }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    bodyFont: { size: 14 },
                    padding: 10
                }
            },
            scales: {
                x: {
                    ticks: { color: '#333', font: { size: 14 } },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#333', font: { size: 14 } },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuad'
            }
        }
    });
}

// Function to create the Line Chart with a smoother curve
async function setupLineChart() {
    const monthlyUserCounts = await fetchMonthlyUsers();
    const labels = Object.keys(monthlyUserCounts).sort();

    const readableLabels = labels.map(label => {
        const [year, month] = label.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    });

    const data = labels.map(label => monthlyUserCounts[label]);
    const ctx = document.getElementById('lineChart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: readableLabels,
            datasets: [{
                label: 'Number of Users',
                data: data,
                borderColor: '#1976D2', // Blue line
                backgroundColor: 'rgba(25, 118, 210, 0.2)',
                borderWidth: 3,
                fill: true,
                pointBackgroundColor: '#1976D2',
                pointBorderColor: '#FFF',
                pointHoverBackgroundColor: '#FFF',
                pointHoverBorderColor: '#1976D2',
                tension: 0.4 // Creates a smooth curved line
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly User Growth',
                    color: '#222',
                    font: { size: 18, weight: 'bold' }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    bodyFont: { size: 14 },
                    padding: 10
                }
            },
            scales: {
                x: {
                    ticks: { color: '#333', font: { size: 14 } },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#333', font: { size: 14 } },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuad'
            }
        }
    });
}


// Call setupLineChart when the document is loaded
document.addEventListener('DOMContentLoaded', setupLineChart);
