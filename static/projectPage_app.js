url = window.location.href;
let projectName = url.split('/')[3].split('-')[1];

function renderTable(table, data) {
    table.innerHTML = '';

    if (data.length == 0) {
        table.innerHTML = '<tr><td>No data found</td></tr>';
        return;
    } else {
        columns = Object.keys(data[0]);
        
        let headerRow = document.createElement('tr');
        for (let i = 0; i < columns.length; i++) {
            let headerCell = document.createElement('th');
            headerCell.innerHTML = columns[i];
            headerRow.appendChild(headerCell);
        }
        table.appendChild(headerRow);

        for (ele of data) {
            let dataRow = document.createElement('tr');
            for (column in ele) {
                let dataCell = document.createElement('td');
                dataCell.innerHTML = ele[column];   
                dataRow.appendChild(dataCell);
            }
            table.appendChild(dataRow);
        }
    }
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}


function showProjectInfo(projectInfo) {

    project_name = projectInfo['name'];
    project_desc = projectInfo['description'];
    project_deadline = projectInfo['deadline'];
    project_deadline = new Date(project_deadline).toDateString('en-CA');

    document.getElementById('project-name').innerHTML = project_name;
    document.getElementById('project-desc').innerHTML = project_desc;
    document.getElementById('project-deadline').innerHTML = project_deadline;
}


function renderProjectInfo(projectName) {
    fetch('/project-' + projectName + '/get-project-info')
        .then(response => response.json())
        .then(data => {
            showProjectInfo(data);
        })
        .catch(error => {
            console.error(error);
        });
}


function renderTaskSection(projectName) {
    fetch('/project-' + projectName + '/get-task-info')
        .then(response => response.json())
        .then(data => {
            let taskInfo = data;
            renderTable(document.getElementById('task-bugs-table'), taskInfo);

        })
        .catch(error => {
            console.error(error);
        });
}

function renderBugsSection(projectName) {
    fetch('/project-' + projectName + '/get-bugs')
        .then(response => response.json())
        .then(data => {
            let bugs = data;
            renderTable(document.getElementById('bugs-table'), bugs);
        })
        .catch(error => {
            console.error(error);
        });
}

function renderTeamMembersSection(projectName) {
    fetch('/project-' + projectName + '/get-all-team-members')  
        .then(response => response.json())
        .then(data => {
            let teamMembers = data;
            renderTable(document.getElementById('team-members-table'), teamMembers);
        })
        .catch(error => {
            console.error(error);
        });
}

function renderProjectPage(projectName) {
    renderProjectInfo(projectName);
    renderTaskSection(projectName);
    renderBugsSection(projectName);
    renderTeamMembersSection(projectName);
}


function renderReportedByTable(employee_id) {
    fetch('/project-' + projectName + '/get-reported-by', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({employee_id: employee_id})
    })
    .then(response => response.json())
    .then(data => {
        if (data['message'] == 'success') {
            let reportedBy = data['result'];
            renderTable(document.getElementById('project-info-table'), reportedBy);
        } else {
            alert(data['message']);
        }
    })
    .catch(error => {
        console.error(error);
    });
}

function showReportedByPopup() {
    // document.getElementById('reportedBy').value = '';
    document.getElementById('project-info-popup').style.display = 'block';

    document.getElementById('info-close-btn').addEventListener('click', function() {
        document.getElementById('project-info-table').innerHTML = '';
        document.getElementById('project-info-popup').style.display = 'none';
        document.getElementById('reportedBy').value = '';
    });

    let employee_id = document.getElementById('reportedBy').value;
    document.getElementById('info-title').innerHTML = "Bugs reported by employee " + employee_id + ": ";

    if (!isNumber(employee_id)) {
        alert("Employee ID must be a number");
        document.getElementById('project-info-table').innerHTML = '';
    } else {
        renderReportedByTable(employee_id);
    }

}

function renderTasksWithFilterBugsTable(condition, number_bugs) {
    fetch('/project-' + projectName + '/get-tasks-with-filter-bugs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({condition: condition, number_bugs: number_bugs})
    })
        .then(response => response.json())
        .then(data => {
            let tasksWithFilterBugs = data['result'];
            renderTable(document.getElementById('project-info-table'), tasksWithFilterBugs);
        })
        .catch(error => {
            console.error(error);
        });
}

function showTasksWithFilterBugsPopup(condition, number_bugs) {

    document.getElementById('project-info-popup').style.display = 'block';

    document.getElementById('info-close-btn').addEventListener('click', function() {
        document.getElementById('project-info-table').innerHTML = '';
        document.getElementById('project-info-popup').style.display = 'none';
    });

    document.getElementById('info-title').innerHTML = "Tasks matching the filter";
    
    renderTasksWithFilterBugsTable(condition, number_bugs);
}

function insertTeamMember(teamMember, projectName) {
    fetch('/project-' + projectName + '/insert-team-member', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(teamMember)
    })
    .then(response => response.json())
    .then(data => {
        if (data['message'] == 'success') {
            renderTeamMembersSection(projectName);
            alert("Team member added successfully");
        } else {
            alert(data['message']);
        }
    })
    .catch(error => {
        console.error(error);
    });

}

function deleteTeamMember(employee_id, projectName) {
    let pname = projectName;
    fetch('/project-' + projectName + '/delete-team-member', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({employee_id: employee_id})
    })
    .then(response => response.json())
    .then(data => {

        if (data['message'] == 'success') {
            renderTeamMembersSection(projectName);
            alert("Team member deleted successfully");
        } else {
            alert(data['message']);
        }   
    })
    .catch(error => {
        console.error(error);    
    });

}

function updateTeamMember(teamMember, projectName) {
    fetch('/project-' + projectName + '/update-team-member', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(teamMember)
    })
    .then(response => response.json())
    .then(data => {
        if (data['message'] == 'success') {
            renderTeamMembersSection(projectName);
            alert("Team member updated successfully");
        } else {
            alert(data['message']);
        }
    })
    .catch(error => {
        console.error(error);
    });

}

function showInsertTeamMemberPopup() {
    document.getElementById('insert-tm-id').value = '';
    document.getElementById('insert-empl-id').value = '';
    document.getElementById('insert-tmb-name').value = '';
    document.getElementById('insert-tmb-seniority').value = '';

    document.getElementById('insert-team-member-popup').style.display = 'block';

    document.getElementById('insert-team-member-close-btn').addEventListener('click', function() {
        document.getElementById('insert-team-member-popup').style.display = 'none';
    });


    document.getElementById('insert-team-member-save-btn').removeEventListener('click', handleAddTeamMemberButtonClick);
    document.getElementById('insert-team-member-save-btn').addEventListener('click', handleAddTeamMemberButtonClick);
}

function handleAddTeamMemberButtonClick(event) {
    event.stopPropagation();
    var teamid = document.getElementById('insert-tm-id').value;
    var emplid = document.getElementById('insert-empl-id').value;
    var name = document.getElementById('insert-tmb-name').value;
    var seniority = document.getElementById('insert-tmb-seniority').value;

    if (teamid == '' || emplid == '' || name == '' || seniority == '') {
        alert("Please enter all the required fields");
    } else if (!isNumber(teamid)) {
        alert("Team ID must be a number");
    } else if (!isNumber(emplid)) {
        alert("Employee ID must be a number");
    } else {
        document.getElementById('insert-team-member-popup').style.display = 'none';
        insertTeamMember({teamid: teamid, emplid: emplid, name: name, seniority: seniority}, projectName);
    }
}

function renderBugsPerTaskTable() {
    fetch('/project-' + projectName + '/get-task-with-numbugs')
        .then(response => response.json())
        .then(data => {
            if (data['message'] == 'success') {
                let bugsPerTask = data['result'];
                renderTable(document.getElementById('task-bugs-table'), bugsPerTask);
            } else {
                alert(data['message']);
            }
        })
        .catch(error => {
            console.error(error);
        });
}

function showDeleteTeamMemberPopup() {  
    document.getElementById('del-empl-id').value = '';
    document.getElementById('delete-team-member-popup').style.display = 'block';

    document.getElementById('delete-team-member-close-btn').addEventListener('click', function() {  
        document.getElementById('delete-team-member-popup').style.display = 'none';
    });

    document.getElementById('delete-team-member-save-btn').removeEventListener('click', handleDeleteTeamMemberButtonClick);
    document.getElementById('delete-team-member-save-btn').addEventListener('click', handleDeleteTeamMemberButtonClick);
}

function handleDeleteTeamMemberButtonClick(event) {
    event.stopPropagation();
    let employee_id = document.getElementById('del-empl-id').value;

    if (employee_id == '') {
        alert("Please enter the employee ID");
    } else if (!isNumber(employee_id)) {
        alert("Employee ID must be a number");
    } else {
        document.getElementById('delete-team-member-popup').style.display = 'none';
        deleteTeamMember(employee_id, projectName);
    }

}

function showUpdateTeamMemberPopup() {
    document.getElementById('update-empl-id').value = '';
    document.getElementById('update-tm-id').value = '';
    document.getElementById('update-tmb-name').value = '';
    document.getElementById('update-tmb-seniority').value = '';

    document.getElementById('update-team-member-popup').style.display = 'block';

    document.getElementById('update-team-member-close-btn').addEventListener('click', function() {
        document.getElementById('update-team-member-popup').style.display = 'none';
    });

    document.getElementById('update-team-member-save-btn').removeEventListener('click', handleUpdateTeamMemberButtonClick);
    document.getElementById('update-team-member-save-btn').addEventListener('click', handleUpdateTeamMemberButtonClick);
}

function handleUpdateTeamMemberButtonClick(event) {
    event.stopPropagation();
    var emplid = document.getElementById('update-empl-id').value;
    var tmid = document.getElementById('update-tm-id').value;
    var name = document.getElementById('update-tmb-name').value;
    var seniority = document.getElementById('update-tmb-seniority').value;

    if (emplid == '') {
        alert("Please enter the employee ID");
    } else if (!isNumber(emplid)) {
        alert("Employee ID must be a number");
    } else if (!isNumber(tmid) && tmid != '') {
        alert("Team ID must be a number");
    } else {
        document.getElementById('update-team-member-popup').style.display = 'none';
        updateTeamMember({emplid: emplid, tmid: tmid, name: name, seniority: seniority}, projectName);
    }
}

document.getElementById('tasks-filter-bugs-btn').addEventListener('click', function() {
    let condition = document.getElementById('task-filter-dropdown').value;
    let number_bugs = document.getElementById('bug-input-field').value;

    
    if (!isNumber(number_bugs)) {
        alert("Number of bugs must be a number");
    } else {
        showTasksWithFilterBugsPopup(condition, number_bugs);
    }
});



document.getElementById('report-bug-btn').addEventListener('click', function() {
    showReportedByPopup();
});

document.getElementById('back-btn').addEventListener('click', function() {
    window.location.href = '/';
});

document.getElementById('insert-team-member-btn').addEventListener('click', function() {
    showInsertTeamMemberPopup();
});

document.getElementById('show-bugs-per-task-btn').addEventListener('click', function() {
    renderBugsPerTaskTable();
});

document.getElementById('delete-team-member-btn').addEventListener('click', function() {
    showDeleteTeamMemberPopup();
});

document.getElementById('update-team-member-btn').addEventListener('click', function() {
    showUpdateTeamMemberPopup();
});

document.getElementById('task-filter-dropdown').addEventListener('change', function() {
    condition = document.getElementById('task-filter-dropdown').value;
    number_bugs = document.getElementById('bug-input-field').value;

    if (document.getElementById('bug-input-field').value == '') {
        document.getElementById('tasks-filter-bugs-btn').innerHTML = 'Show tasks';
    } else {
        document.getElementById('tasks-filter-bugs-btn').innerHTML = 'Show tasks with bugs ' + condition + ' ' + number_bugs;
    }
});

document.getElementById('bug-input-field').addEventListener('keyup', function() {
    condition = document.getElementById('task-filter-dropdown').value;
    number_bugs = document.getElementById('bug-input-field').value;

    if (document.getElementById('bug-input-field').value == '') {
        document.getElementById('tasks-filter-bugs-btn').innerHTML = 'Show tasks';
    }

    document.getElementById('tasks-filter-bugs-btn').innerHTML = 'Show tasks with bugs ' + condition + ' ' + number_bugs;
});



renderProjectPage(projectName);