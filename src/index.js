// Simple Data Display Interface
class DataDisplay {
  constructor() {
    this.currentData = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    // Don't load sample data - wait for FileMaker to provide data via window.loadContactData()
    this.showWaitingMessage();
  }

  showWaitingMessage() {
    document.getElementById('contactName').textContent = 'Waiting for data...';
    // Clear any existing content
    document.getElementById('caseNotesList').innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">Waiting for FileMaker to provide data...</p>';
    document.getElementById('programsList').innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">Waiting for FileMaker to provide data...</p>';
    document.getElementById('attendanceSummary').innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">Waiting for FileMaker to provide data...</p>';
    document.getElementById('attendanceCalendar').innerHTML = '';
  }

  setupEventListeners() {
    // Add case note button
    document.getElementById('addCaseNoteBtn').addEventListener('click', () => {
      this.addCaseNote();
    });
  }

  // Function to be called from FileMaker with data parameter
  loadData(dataJson) {
    try {
      if (typeof dataJson === 'string') {
        this.currentData = JSON.parse(dataJson);
      } else {
        this.currentData = dataJson;
      }
      this.renderData();
    } catch (error) {
      console.error('Error loading data:', error);
      this.showError('Failed to load data');
    }
  }

  renderData() {
    if (!this.currentData) return;

    this.renderContactName();
    this.renderCaseNotes();
    this.renderPrograms();
    this.renderAttendance();
  }

  renderContactName() {
    const { name, image } = this.currentData;
    document.getElementById('contactName').textContent = name;
    
    // Handle image if provided
    const imageContainer = document.getElementById('contactImage');
    const imageElement = document.getElementById('contactImageElement');
    
    if (image) {
      // Add data:image prefix if not already present
      const imageSource = image.startsWith('data:') ? image : `data:image/png;base64,${image}`;
      imageElement.src = imageSource;
      imageContainer.style.display = 'block';
    } else {
      imageContainer.style.display = 'none';
    }
  }

  renderCaseNotes() {
    const { caseNotes } = this.currentData;
    const caseNotesList = document.getElementById('caseNotesList');
    
    // Sort case notes by date (most recent first)
    const sortedNotes = [...caseNotes].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    caseNotesList.innerHTML = sortedNotes.map(note => `
      <div class="case-note-item">
        <div class="case-note-header">
          <span class="case-note-subject">${note.subject || 'General Note'}</span>
          <span class="case-note-date">${note.date}</span>
        </div>
        <div class="case-note-meta">
          ${note.chef ? `Chef: ${note.chef} | ` : ''}
          ${note.staff ? `Staff: ${note.staff} | ` : ''}
          User: ${note.user || 'Unknown'}
        </div>
        <div class="case-note-content">${note.note}</div>
      </div>
    `).join('');
    
    // Match the height of case notes to left column after rendering
    this.matchColumnHeights();
  }

  renderPrograms() {
    const { programs } = this.currentData;
    const programsList = document.getElementById('programsList');
    
    programsList.innerHTML = programs.map(program => `
      <div class="program-item">
        <span class="program-name">${program.program}</span>
        <div class="program-tiers">
          <span class="tier-status ${this.getTierClass(program.tier1)}">
            ${this.getTierText(program.tier1, 'Tier 1')}
          </span>
          <span class="tier-status ${this.getTierClass(program.tier2)}">
            ${this.getTierText(program.tier2, 'Tier 2')}
          </span>
          <span class="tier-status ${this.getTierClass(program.tier3)}">
            ${this.getTierText(program.tier3, 'Tier 3')}
          </span>
        </div>
      </div>
    `).join('');
    
    // Match the height of case notes to left column
    this.matchColumnHeights();
  }

  matchColumnHeights() {
    // Wait for next tick to ensure DOM is updated
    setTimeout(() => {
      const leftColumn = document.querySelector('.left-column');
      const caseNotesSection = document.querySelector('.case-notes-section');
      
      if (leftColumn && caseNotesSection) {
        const leftColumnHeight = leftColumn.offsetHeight;
        caseNotesSection.style.height = `${leftColumnHeight}px`;
      }
    }, 10);
  }

  getTierText(status, defaultText) {
    if (!status) return defaultText;
    if (status.toLowerCase() === 'complete') return defaultText;
    if (status.toLowerCase() === 'na') return 'N/A';
    return status;
  }

  renderAttendance() {
    const { attendance } = this.currentData;
    
    // Calculate summary statistics
    const summary = this.calculateAttendanceSummary(attendance);
    this.renderAttendanceSummary(summary);
    
    // Render calendar
    this.renderAttendanceCalendar(attendance);
    
    // Match the height of case notes to left column
    this.matchColumnHeights();
  }

  calculateAttendanceSummary(attendance) {
    const summary = {
      present: 0,
      late: 0,
      leftEarly: 0,
      absent: 0,
      ncns: 0,
      total: 0
    };

    attendance.forEach(item => {
      if (item.type) {
        summary.total++;
        const type = item.type.toLowerCase();
        if (type === 'present') summary.present++;
        else if (type === 'late') summary.late++;
        else if (type === 'left early') summary.leftEarly++;
        else if (type === 'absent') summary.absent++;
        else if (type === 'ncns') summary.ncns++;
      }
    });

    return summary;
  }

  renderAttendanceSummary(summary) {
    const summaryContainer = document.getElementById('attendanceSummary');
    
    if (!summaryContainer) {
      console.error('attendanceSummary element not found!');
      return;
    }
    
    summaryContainer.innerHTML = `
      <div class="summary-grid">
        <div class="summary-item present">
          <span class="summary-count">${summary.present}</span>
          <span class="summary-label">Present</span>
        </div>
        <div class="summary-item late">
          <span class="summary-count">${summary.late}</span>
          <span class="summary-label">Late</span>
        </div>
        <div class="summary-item left-early">
          <span class="summary-count">${summary.leftEarly}</span>
          <span class="summary-label">Left Early</span>
        </div>
        <div class="summary-item absent">
          <span class="summary-count">${summary.absent}</span>
          <span class="summary-label">Absent</span>
        </div>
        <div class="summary-item ncns">
          <span class="summary-count">${summary.ncns}</span>
          <span class="summary-label">NCNS</span>
        </div>
      </div>
    `;
  }

  renderAttendanceCalendar(attendance) {
    const calendarContainer = document.getElementById('attendanceCalendar');
    
    if (!calendarContainer) {
      console.error('attendanceCalendar element not found!');
      return;
    }
    
    // Create a map of dates to attendance data
    const attendanceMap = new Map();
    attendance.forEach(item => {
      if (item.date) {
        // Parse date properly - handle MM/DD/YYYY format
        const dateParts = item.date.split('/');
        if (dateParts.length === 3) {
          const month = parseInt(dateParts[0]) - 1; // Month is 0-based
          const day = parseInt(dateParts[1]);
          const year = parseInt(dateParts[2]);
          const date = new Date(year, month, day);
          attendanceMap.set(date.toDateString(), item);
        }
      }
    });

    // Generate multiple months - get range from attendance data
    const months = this.getAttendanceMonths(attendance);
    
    calendarContainer.innerHTML = months.map(monthDate => {
      const calendar = this.generateCalendarMonth(monthDate, attendanceMap);
      const monthName = monthDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      return `
        <div class="calendar-month">
          <div class="calendar-month-header">${monthName}</div>
          <div class="calendar-grid">
            <div class="calendar-header">
              <div class="calendar-day-header">Sun</div>
              <div class="calendar-day-header">Mon</div>
              <div class="calendar-day-header">Tue</div>
              <div class="calendar-day-header">Wed</div>
              <div class="calendar-day-header">Thu</div>
              <div class="calendar-day-header">Fri</div>
              <div class="calendar-day-header">Sat</div>
            </div>
            ${calendar.map(day => this.renderCalendarDay(day)).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  getAttendanceMonths(attendance) {
    // Get all unique months from attendance data
    const monthSet = new Set();
    const currentDate = new Date();
    
    attendance.forEach(item => {
      if (item.date && item.type) {
        // Parse the date properly - handle both MM/DD/YYYY and M/D/YYYY formats
        const dateParts = item.date.split('/');
        if (dateParts.length === 3) {
          const month = parseInt(dateParts[0]) - 1; // Month is 0-based
          const year = parseInt(dateParts[2]);
          const monthKey = `${year}-${month}`;
          monthSet.add(monthKey);
        }
      }
    });

    // Convert to date objects and sort
    const months = Array.from(monthSet)
      .map(key => {
        const [year, month] = key.split('-').map(Number);
        return new Date(year, month, 1);
      })
      .sort((a, b) => b - a); // Most recent first

    // If no attendance data, show current month and previous month
    if (months.length === 0) {
      const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const previous = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      return [current, previous];
    }

    // Limit to last 6 months to keep it manageable
    return months.slice(0, 6);
  }

  generateCalendarMonth(monthDate, attendanceMap) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    
    // Start from the beginning of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendar = [];
    const today = new Date();
    
    // Generate 6 weeks (42 days) to fill the calendar grid
    for (let i = 0; i < 42; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDay.getMonth() === month;
      const isToday = currentDay.toDateString() === today.toDateString();
      const attendanceData = attendanceMap.get(currentDay.toDateString());
      
      calendar.push({
        date: currentDay,
        dayNumber: currentDay.getDate(),
        isCurrentMonth,
        isToday,
        attendance: attendanceData
      });
    }
    
    return calendar;
  }

  renderCalendarDay(day) {
    const { date, dayNumber, isCurrentMonth, isToday, attendance } = day;
    
    let classes = ['calendar-day'];
    let statusText = '';
    let tooltip = '';
    
    if (!isCurrentMonth) {
      classes.push('other-month');
    }
    
    if (isToday) {
      classes.push('today');
    }
    
    if (attendance && attendance.type) {
      const type = attendance.type.toLowerCase().replace(/\s+/g, '-');
      classes.push(type);
      
      if (attendance.excused && attendance.excused.toLowerCase() === 'yes') {
        classes.push('excused');
      }
      
      // Set status text for display
      switch (type) {
        case 'present': statusText = 'P'; break;
        case 'late': statusText = 'L'; break;
        case 'left-early': statusText = 'LE'; break;
        case 'absent': statusText = 'A'; break;
        case 'ncns': statusText = 'NC'; break;
        default: statusText = '?'; break;
      }
      
      // Create tooltip if there's a note
      if (attendance.note) {
        tooltip = `<div class="attendance-note-tooltip">${attendance.note}</div>`;
      }
    }
    
    return `
      <div class="${classes.join(' ')}" data-date="${date.toISOString()}">
        <div class="calendar-day-number">${dayNumber}</div>
        ${statusText ? `<div class="calendar-day-status">${statusText}</div>` : ''}
        ${tooltip}
      </div>
    `;
  }

  getTierClass(status) {
    if (!status) return 'tier-empty';
    if (status.toLowerCase() === 'complete') return 'tier-complete';
    if (status.toLowerCase() === 'na') return 'tier-na';
    return 'tier-empty';
  }

  addCaseNote() {
    // Call FileMaker script to add a new case note
    this.callFileMakerScript('Manage: Staff Mtg', {
      mode: 'cnNew'
    });
  }

  addCaseNoteWithData(caseNoteData) {
    // Add a case note with provided data to the current display
    try {
      // Handle both JSON strings and objects
      let parsedData = caseNoteData;
      if (typeof caseNoteData === 'string') {
        try {
          parsedData = JSON.parse(caseNoteData);
        } catch (parseError) {
          console.error('Failed to parse JSON string:', parseError);
          console.error('Received data:', caseNoteData);
          return;
        }
      }

      // Validate required data
      if (!parsedData || typeof parsedData !== 'object') {
        console.error('Invalid case note data provided');
        console.error('Received:', parsedData);
        console.error('Type:', typeof parsedData);
        return;
      }

      // Initialize currentData if it doesn't exist
      if (!this.currentData) {
        this.currentData = {
          name: 'Unknown Contact',
          caseNotes: [],
          attendance: [],
          programs: []
        };
      }

      // Initialize caseNotes array if it doesn't exist
      if (!this.currentData.caseNotes) {
        this.currentData.caseNotes = [];
      }

      // Create case note object with defaults
      const newCaseNote = {
        date: parsedData.date || new Date().toLocaleDateString('en-US'),
        subject: parsedData.subject || 'General Note',
        note: parsedData.note || '',
        chef: parsedData.chef || '',
        staff: parsedData.staff || '',
        user: parsedData.user || 'Unknown'
      };

      // Add to the beginning of the case notes array (most recent first)
      this.currentData.caseNotes.unshift(newCaseNote);

      // Re-render the case notes section
      this.renderCaseNotes();

      console.log('Case note added successfully:', newCaseNote);
    } catch (error) {
      console.error('Error adding case note:', error);
    }
  }

  callFileMakerScript(scriptName, parameters = {}) {
    // Check if we're running in FileMaker WebViewer
    if (window.FileMaker) {
      try {
        window.FileMaker.PerformScript(scriptName, JSON.stringify(parameters));
      } catch (error) {
        console.error('Error calling FileMaker script:', error);
      }
    } else {
      // For development/testing outside FileMaker
      console.log(`Would call FileMaker script: ${scriptName}`, parameters);
      alert(`FileMaker Script Call: ${scriptName}\nParameters: ${JSON.stringify(parameters, null, 2)}`);
    }
  }

  showError(message) {
    console.error(message);
    document.getElementById('contactName').textContent = `Error: ${message}`;
  }
}

// Initialize the interface
const dataDisplay = new DataDisplay();

// Make the interface available globally for FileMaker to call
window.DataDisplay = dataDisplay;

// Function for FileMaker to call with data
window.loadContactData = function(dataJson) {
  dataDisplay.loadData(dataJson);
};

// Function for FileMaker to call to add a case note
window.addNewCaseNote = function() {
  dataDisplay.addCaseNote();
};

// Function for FileMaker to call to add a case note with data
window.addCaseNoteWithData = function(caseNoteData) {
  dataDisplay.addCaseNoteWithData(caseNoteData);
};

console.log('Data Display Interface loaded');
console.log('Available functions for FileMaker:');
console.log('- window.loadContactData(jsonData)');
console.log('- window.addNewCaseNote()');
console.log('- window.addCaseNoteWithData(caseNoteData)');
console.log('- window.DataDisplay (main interface object)');