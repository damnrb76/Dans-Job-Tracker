// Job Application Tracker - Main JavaScript File
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const addNewBtn = document.getElementById('addNewBtn');
    const viewAllBtn = document.getElementById('viewAllBtn');
    const applicationTypeToggle = document.getElementById('applicationTypeToggle');
    const formSection = document.getElementById('formSection');
    const listSection = document.getElementById('listSection');
    const detailsSection = document.getElementById('detailsSection');
    const applicationForm = document.getElementById('applicationForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const applicationsList = document.getElementById('applicationsList');
    const applicationDetails = document.getElementById('applicationDetails');
    const editBtn = document.getElementById('editBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const backBtn = document.getElementById('backBtn');
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const exportBtn = document.getElementById('exportBtn');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const clearFilterBtn = document.getElementById('clearFilterBtn');
    const formTitle = document.getElementById('formTitle');

    // Application state
    let applications = JSON.parse(localStorage.getItem('applications')) || [];
    let currentApplicationId = null;
    let activeFilters = {
        type: 'all',
        startDate: null,
        endDate: null
    };

    // Initialize the application
    init();

    // Event Listeners
    addNewBtn.addEventListener('click', showAddForm);
    viewAllBtn.addEventListener('click', showListView);
    applicationForm.addEventListener('submit', saveApplication);
    cancelBtn.addEventListener('click', cancelForm);
    applicationTypeToggle.addEventListener('change', filterApplicationsByType);
    editBtn.addEventListener('click', editCurrentApplication);
    deleteBtn.addEventListener('click', showDeleteConfirmation);
    backBtn.addEventListener('click', showListView);
    confirmDeleteBtn.addEventListener('click', deleteApplication);
    cancelDeleteBtn.addEventListener('click', hideDeleteConfirmation);
    exportBtn.addEventListener('click', exportWorkplaceApplications);
    applyFilterBtn.addEventListener('click', applyDateFilter);
    clearFilterBtn.addEventListener('click', clearDateFilter);

    // Set today's date as default for status date
    document.getElementById('statusDate').valueAsDate = new Date();

    function init() {
        renderApplicationsList();
        setDefaultDates();
    }

    function setDefaultDates() {
        // Set default date range (last month to today)
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        startDateInput.valueAsDate = lastMonth;
        endDateInput.valueAsDate = today;
    }

    function showAddForm() {
        formTitle.textContent = 'Add New Application';
        currentApplicationId = null;
        applicationForm.reset();
        document.getElementById('statusDate').valueAsDate = new Date();
        
        formSection.classList.remove('hidden');
        listSection.classList.add('hidden');
        detailsSection.classList.add('hidden');
    }

    function showEditForm() {
        formTitle.textContent = 'Edit Application';
        formSection.classList.remove('hidden');
        listSection.classList.add('hidden');
        detailsSection.classList.add('hidden');
    }

    function showListView() {
        formSection.classList.add('hidden');
        listSection.classList.remove('hidden');
        detailsSection.classList.add('hidden');
        renderApplicationsList();
    }

    function showDetailsView(id) {
        currentApplicationId = id;
        const application = applications.find(app => app.id === id);
        
        if (!application) {
            alert('Application not found!');
            showListView();
            return;
        }
        
        renderApplicationDetails(application);
        
        formSection.classList.add('hidden');
        listSection.classList.add('hidden');
        detailsSection.classList.remove('hidden');
    }

    function saveApplication(e) {
        e.preventDefault();
        
        const application = {
            id: currentApplicationId || generateId(),
            isWorkplace: document.getElementById('isWorkplace').value,
            vacancyNumber: document.getElementById('vacancyNumber').value,
            jobTitle: document.getElementById('jobTitle').value,
            employer: document.getElementById('employer').value,
            salary: document.getElementById('salary').value,
            jobDescription: document.getElementById('jobDescription').value,
            closingDate: document.getElementById('closingDate').value,
            status: document.getElementById('status').value,
            statusDate: document.getElementById('statusDate').value,
            assessmentDateTime: document.getElementById('assessmentDateTime').value,
            interviewDateTime: document.getElementById('interviewDateTime').value,
            customCV: document.getElementById('customCV').value,
            notes: document.getElementById('notes').value,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (currentApplicationId) {
            // Edit existing application
            const index = applications.findIndex(app => app.id === currentApplicationId);
            if (index !== -1) {
                application.createdAt = applications[index].createdAt;
                applications[index] = application;
            }
        } else {
            // Add new application
            applications.push(application);
        }
        
        // Save to localStorage
        saveToLocalStorage();
        
        // Show the updated list
        showListView();
    }

    function cancelForm() {
        applicationForm.reset();
        showListView();
    }

    function renderApplicationsList() {
        // Clear current list
        applicationsList.innerHTML = '';
        
        // Get filtered applications
        const filteredApplications = getFilteredApplications();
        
        if (filteredApplications.length === 0) {
            applicationsList.innerHTML = `
                <div class="empty-state">
                    <p>No applications found. ${activeFilters.type !== 'all' || activeFilters.startDate || activeFilters.endDate ? 'Try changing your filters or ' : ''}Click "Add New Application" to get started.</p>
                </div>
            `;
            return;
        }
        
        // Sort applications by updated date (newest first)
        filteredApplications.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        // Render each application card
        filteredApplications.forEach(application => {
            const card = document.createElement('div');
            card.className = `application-card status-${application.status.toLowerCase().replace(/ /g, '-')}`;
            card.dataset.id = application.id;
            
            // Format the status date
            const statusDate = application.statusDate ? new Date(application.statusDate).toLocaleDateString('en-GB') : 'N/A';
            
            card.innerHTML = `
                <div class="application-tag ${application.isWorkplace === 'workplace' ? 'workplace-tag' : 'personal-tag'}">
                    ${application.isWorkplace === 'workplace' ? 'Workplace' : 'Personal'}
                </div>
                <h3>${application.jobTitle}</h3>
                <p><strong>Employer:</strong> ${application.employer}</p>
                <p><strong>Vacancy #:</strong> ${application.vacancyNumber}</p>
                <p class="card-status">${application.status} (${statusDate})</p>
            `;
            
            card.addEventListener('click', () => {
                showDetailsView(application.id);
            });
            
            applicationsList.appendChild(card);
        });
    }

    function renderApplicationDetails(application) {
        applicationDetails.innerHTML = '';
        
        // Format dates for display
        const formattedClosingDate = application.closingDate ? new Date(application.closingDate).toLocaleDateString('en-GB') : 'N/A';
        const formattedStatusDate = application.statusDate ? new Date(application.statusDate).toLocaleDateString('en-GB') : 'N/A';
        
        // Format assessment date/time
        let formattedAssessmentDateTime = 'N/A';
        if (application.assessmentDateTime) {
            const date = new Date(application.assessmentDateTime);
            formattedAssessmentDateTime = `${date.toLocaleDateString('en-GB')} at ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Format interview date/time
        let formattedInterviewDateTime = 'N/A';
        if (application.interviewDateTime) {
            const date = new Date(application.interviewDateTime);
            formattedInterviewDateTime = `${date.toLocaleDateString('en-GB')} at ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
        }

        applicationDetails.innerHTML = `
            <div class="application-tag ${application.isWorkplace === 'workplace' ? 'workplace-tag' : 'personal-tag'}" style="position: static; display: inline-block; margin-bottom: 1rem;">
                ${application.isWorkplace === 'workplace' ? 'Workplace Redeployment' : 'Personal Job Search'}
            </div>
            
            <div class="detail-group">
                <h3>Basic Information</h3>
                <p><strong>Job Title:</strong> ${application.jobTitle}</p>
                <p><strong>Vacancy Number:</strong> ${application.vacancyNumber}</p>
                <p><strong>Employer:</strong> ${application.employer}</p>
                <p><strong>Salary:</strong> ${application.salary || 'Not specified'}</p>
            </div>
            
            <div class="detail-group">
                <h3>Job Description</h3>
                <div class="detail-content">${application.jobDescription || 'No description provided'}</div>
            </div>
            
            <div class="detail-group">
                <h3>Status Information</h3>
                <p><strong>Current Status:</strong> ${application.status}</p>
                <p><strong>Status Date:</strong> ${formattedStatusDate}</p>
                <p><strong>Closing Date:</strong> ${formattedClosingDate}</p>
            </div>
            
            <div class="detail-group">
                <h3>Important Dates</h3>
                <p><strong>Assessment Date/Time:</strong> ${formattedAssessmentDateTime}</p>
                <p><strong>Interview Date/Time:</strong> ${formattedInterviewDateTime}</p>
            </div>
            
            ${application.customCV ? `
            <div class="detail-group">
                <h3>Custom CV</h3>
                <div class="detail-content">${application.customCV}</div>
            </div>
            ` : ''}
            
            ${application.notes ? `
            <div class="detail-group">
                <h3>Notes</h3>
                <div class="detail-content">${application.notes}</div>
            </div>
            ` : ''}
        `;
    }

    function editCurrentApplication() {
        const application = applications.find(app => app.id === currentApplicationId);
        
        if (!application) {
            alert('Application not found!');
            return;
        }
        
        // Populate the form with current values
        document.getElementById('applicationId').value = application.id;
        document.getElementById('isWorkplace').value = application.isWorkplace;
        document.getElementById('vacancyNumber').value = application.vacancyNumber;
        document.getElementById('jobTitle').value = application.jobTitle;
        document.getElementById('employer').value = application.employer;
        document.getElementById('salary').value = application.salary;
        document.getElementById('jobDescription').value = application.jobDescription;
        document.getElementById('closingDate').value = application.closingDate;
        document.getElementById('status').value = application.status;
        document.getElementById('statusDate').value = application.statusDate;
        document.getElementById('assessmentDateTime').value = application.assessmentDateTime;
        document.getElementById('interviewDateTime').value = application.interviewDateTime;
        document.getElementById('customCV').value = application.customCV;
        document.getElementById('notes').value = application.notes;
        
        showEditForm();
    }

    function showDeleteConfirmation() {
        confirmationModal.classList.remove('hidden');
    }

    function hideDeleteConfirmation() {
        confirmationModal.classList.add('hidden');
    }

    function deleteApplication() {
        applications = applications.filter(app => app.id !== currentApplicationId);
        saveToLocalStorage();
        hideDeleteConfirmation();
        showListView();
    }

    function getFilteredApplications() {
        return applications.filter(app => {
            // Filter by type
            if (activeFilters.type === 'workplace' && app.isWorkplace !== 'workplace') {
                return false;
            }
            if (activeFilters.type === 'personal' && app.isWorkplace !== 'personal') {
                return false;
            }
            
            // Filter by date range
            if (activeFilters.startDate || activeFilters.endDate) {
                const appDate = new Date(app.statusDate);
                
                if (activeFilters.startDate && appDate < activeFilters.startDate) {
                    return false;
                }
                
                if (activeFilters.endDate) {
                    const endDatePlus1 = new Date(activeFilters.endDate);
                    endDatePlus1.setDate(endDatePlus1.getDate() + 1);
                    
                    if (appDate >= endDatePlus1) {
                        return false;
                    }
                }
            }
            
            return true;
        });
    }

    function filterApplicationsByType() {
        activeFilters.type = applicationTypeToggle.value;
        renderApplicationsList();
    }

    function applyDateFilter() {
        activeFilters.startDate = startDateInput.value ? new Date(startDateInput.value) : null;
        activeFilters.endDate = endDateInput.value ? new Date(endDateInput.value) : null;
        renderApplicationsList();
    }

    function clearDateFilter() {
        startDateInput.value = '';
        endDateInput.value = '';
        activeFilters.startDate = null;
        activeFilters.endDate = null;
        renderApplicationsList();
    }

    function exportWorkplaceApplications() {
        // Filter only workplace applications within the date range
        const workplaceApplications = applications.filter(app => {
            if (app.isWorkplace !== 'workplace') {
                return false;
            }
            
            // Apply date filters if set
            if (activeFilters.startDate || activeFilters.endDate) {
                const appDate = new Date(app.statusDate);
                
                if (activeFilters.startDate && appDate < activeFilters.startDate) {
                    return false;
                }
                
                if (activeFilters.endDate) {
                    const endDatePlus1 = new Date(activeFilters.endDate);
                    endDatePlus1.setDate(endDatePlus1.getDate() + 1);
                    
                    if (appDate >= endDatePlus1) {
                        return false;
                    }
                }
            }
            
            return true;
        });
        
        if (workplaceApplications.length === 0) {
            alert('No workplace applications found for the selected date range.');
            return;
        }
        
        // Create a worksheet from the filtered data
        const worksheet = XLSX.utils.json_to_sheet(workplaceApplications.map(app => {
            // Format dates for Excel
            const formatDate = (dateString) => {
                return dateString ? new Date(dateString).toLocaleDateString('en-GB') : '';
            };
            
            const formatDateTime = (dateTimeString) => {
                if (!dateTimeString) return '';
                const date = new Date(dateTimeString);
                return `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
            };
            
            return {
                'Vacancy Number': app.vacancyNumber,
                'Job Title': app.jobTitle,
                'Employer': app.employer,
                'Salary': app.salary,
                'Job Description': app.jobDescription,
                'Closing Date': formatDate(app.closingDate),
                'Status': app.status,
                'Status Date': formatDate(app.statusDate),
                'Assessment Date/Time': formatDateTime(app.assessmentDateTime),
                'Interview Date/Time': formatDateTime(app.interviewDateTime),
                'Notes': app.notes
            };
        }));
        
        // Set column widths
        const wscols = [
            {wch: 15}, // Vacancy Number
            {wch: 30}, // Job Title
            {wch: 25}, // Employer
            {wch: 15}, // Salary
            {wch: 50}, // Job Description
            {wch: 15}, // Closing Date
            {wch: 20}, // Status
            {wch: 15}, // Status Date
            {wch: 25}, // Assessment Date/Time
            {wch: 25}, // Interview Date/Time
            {wch: 50}  // Notes
        ];
        worksheet['!cols'] = wscols;
        
        // Create a workbook with the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Workplace Applications');
        
        // Generate filename with date range
        let filename = 'Workplace_Applications';
        if (activeFilters.startDate && activeFilters.endDate) {
            const startStr = activeFilters.startDate.toISOString().split('T')[0];
            const endStr = activeFilters.endDate.toISOString().split('T')[0];
            filename += `_${startStr}_to_${endStr}`;
        }
        filename += '.xlsx';
        
        // Export to XLSX file
        XLSX.writeFile(workbook, filename);
    }

    function saveToLocalStorage() {
        localStorage.setItem('applications', JSON.stringify(applications));
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
});
