let gridContainer = document.getElementById('gridContainer');
let projectCount = 0;

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


function openProjectPage(projectName) {
    var url = '/project-' + projectName + '/';
    window.location.href = url;
    document.getElementById('home-body').innerHTML = '';
}

function deleteProject(projectName) {
    var url = '/delete-project';
    var data = {
        projectName: projectName
    };
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        renderProjectsHome();
    })
    .catch(error => {
        console.error(error);
    });
}


function showProjectsGrid(projects) {
    gridContainer.innerHTML = '';  
    projectCount = projects.length;

    if (projectCount == 0) {
        var noProjectsDiv = document.createElement('div');
        noProjectsDiv.id = 'no-projects-div';
        noProjectsDiv.textContent = "No Projects";
        gridContainer.appendChild(noProjectsDiv);
        return;
    } else {
        projects.forEach(project => {
            gridContainer.appendChild(createProjectDiv(project));
        });
    }

}

function createProjectDiv(project) {
    var box = document.createElement('div');
    box.className = 'projectBox';
    box.id = project.name + '-div';
    deadline = new Date(project.deadline).toDateString('en-CA');
    
    let nameParagraph = document.createElement('H3');
    nameParagraph.textContent = project.name;
    let deadlineParagraph = document.createElement('p');
    deadlineParagraph.textContent = deadline;
    deadlineParagraph.style.color = 'red';
    deadlineParagraph.style.fontSize = 'small';

    box.appendChild(nameParagraph);
    nameParagraph.appendChild(deadlineParagraph);

    box.addEventListener('click', function(event) {
        event.stopPropagation();
        openProjectPage(project.name);
    });
    

    // Create the trash icon container
    var trashIconContainer = document.createElement('div');
    trashIconContainer.className = 'trash-icon-container';
    trashIconContainer.id = project.name + '-trash-icon-container';
    trashIconContainer.innerHTML = '&times;';

    // Add an event listener for the trash icon
    trashIconContainer.addEventListener('click', function(event) {
        event.stopPropagation(); // Prevent the box's click event from firing

        deleteProject(project.name);

        // Remove the box and the trash icon container from the DOM
        var trashIconContainer = document.getElementById(project.name + '-trash-icon-container');
        var trashIconContainerParent = trashIconContainer.parentNode;
        trashIconContainerParent.removeChild(trashIconContainer);
        var box = document.getElementById(project.name + '-div');
        box.parentNode.removeChild(box);
    });

    // Append the trash icon container to the box
    box.appendChild(trashIconContainer);

    return box;
}   


function renderProjectsHome() {

    fetch('/home') // Fetch data from the server
        .then(response => response.json()) 
        .then(data => { 
            showProjectsGrid(data);
        })
        .catch(error => {
            console.error(error);
        });
}

function addProject(projectName, projectDesc, projectDeadline) {
    var projectData = {
        name: projectName,
        description: projectDesc,
        deadline: projectDeadline
    };

    fetch('/add-project', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
    })
    .then(response => response.json())
    .then(data => {
        if (projectCount == 0) {
            gridContainer.innerHTML = '';
        }
        gridContainer.appendChild(createProjectDiv(projectData));
        projectCount++;
    })
    .catch(error => {
        console.error(error);
    });
}

function showAddProjectPopup() {
    // clear the form
    document.getElementById('proj-name').value = '';
    document.getElementById('proj-desc').value = '';
    document.getElementById('proj-deadline').value = '';

    document.getElementById('add-project-popup').style.display = 'block';

    document.getElementById('add-project-close-btn').addEventListener('click', function() {
        document.getElementById('add-project-popup').style.display = 'none';
    });


    document.getElementById('saveBtn').removeEventListener('click', handleAddProjectButtonClick);
    document.getElementById('saveBtn').addEventListener('click', handleAddProjectButtonClick);

}

function handleAddProjectButtonClick(event) {
    event.stopPropagation();
    var projectName = document.getElementById('proj-name').value;
    var projectDesc = document.getElementById('proj-desc').value;
    var projectDeadline = document.getElementById('proj-deadline').value;

    if (projectName == '' || projectDesc == '') {
        alert("Please enter all the required fields");
    } else {
        document.getElementById('add-project-popup').style.display = 'none';
        addProject(projectName, projectDesc, projectDeadline);
    }
}

function showFilterDeadlinePopup() {
    document.getElementById('filter-condition').value = '';

    document.getElementById('filter-deadline-popup').style.display = 'block';

    document.getElementById('filter-close-btn').addEventListener('click', function() {
        document.getElementById('filter-deadline-popup').style.display = 'none';
    });


    document.getElementById('filter-apply-button').removeEventListener('click', handleFilterApplyButtonClick);
    document.getElementById('filter-apply-button').addEventListener('click', handleFilterApplyButtonClick);
}

function filterProjects(filterCondition) {

    fetch('/filter-projects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({filterCondition: filterCondition})
    })
    .then(response => response.json())
    .then(data => {

        if (data['message'] == 'success') {
            showProjectsGrid(data['result']);
        } else {
            alert(data['message']);
        }
        
    })

}

function handleFilterApplyButtonClick(event) {
    event.stopPropagation();
    var filterCondition = document.getElementById('filter-condition').value;

    document.getElementById('filter-deadline-popup').style.display = 'none';
    filterProjects(filterCondition);
}

// Add event listener to the button
document.getElementById('add-project-btn').addEventListener('click', function() {
    showAddProjectPopup();
});

document.getElementById('filter-deadline-btn').addEventListener('click', function() {
    showFilterDeadlinePopup();
});

document.getElementById('reset-btn').addEventListener('click', function() {
    renderProjectsHome();
});

document.getElementById('projection-dropdown').addEventListener('change', function() {
    populateRelationAttributes(this.value);
});

document.getElementById('show-average-btn').addEventListener('click', function() {
    showAvgTeamMembersPopup();
});

document.getElementById('show-all-teams-btn').addEventListener('click', function() {
    showAllTeamsPopup();
});

function renderAllTeamsTable() {

    fetch('/get-all-teams')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            let allTeamMembers = data;
            renderTable(document.getElementById('project-info-table'), allTeamMembers);
        })
        .catch(error => {
            console.error(error);
        });
    
}

function showAllTeamsPopup() {
    document.getElementById('project-info-popup').style.display = 'block';

    document.getElementById('info-close-btn').addEventListener('click', function() {
        document.getElementById('project-info-popup').style.display = 'none';
    });

    document.getElementById('info-title').innerHTML = "Teams who are part of all projects: ";
    renderAllTeamsTable();
}

document.getElementById('show-projection-btn').addEventListener('click', function() {

    let relation = document.getElementById('projection-dropdown').value;
    let attributes = getSelectedAttributes();

    if (attributes.length == 0) {
        alert("Please select at least one attribute");
        return
    } else {
        showProjectionPopup(relation, attributes);
    }

});

function renderProjectionTable(relation, attributes) {
    let attributeString = attributes.join('+');

    fetch('/get-projection/' + relation + '/' + attributeString)
        .then(response => response.json())
        .then(data => {
            let projection = data;
            renderTable(document.getElementById('project-info-table'), projection);
        })
        .catch(error => {
            console.error(error);
        });
    
}

function showProjectionPopup(relation, attributes) {
    document.getElementById('project-info-popup').style.display = 'block';

    document.getElementById('info-close-btn').addEventListener('click', function() {
        document.getElementById('project-info-popup').style.display = 'none';
    });

    document.getElementById('info-title').innerHTML = "Projection of " + relation + " on " + attributes;
    renderProjectionTable(relation, attributes);
}

function renderAvgTeamMembersTable() {

    fetch('/get-avg-team-members')
        .then(response => response.json())
        .then(data => {
            let avgTeamMembers = data;
            console.log(avgTeamMembers);
            renderTable(document.getElementById('project-info-table'), avgTeamMembers);
        })
        .catch(error => {
            console.error(error);
        });
    
}

function showAvgTeamMembersPopup() {
    document.getElementById('project-info-popup').style.display = 'block';

    document.getElementById('info-close-btn').addEventListener('click', function() {
        document.getElementById('project-info-popup').style.display = 'none';
    });


    document.getElementById('info-title').innerHTML = "Average number of team members per team: ";
    renderAvgTeamMembersTable();
    
}

function getSelectedAttributes() {
    const attributionSelectForm = document.getElementById('attribution-select-form');
    let selectedAttributes = [];
    let checkboxes = attributionSelectForm.getElementsByTagName('input');
    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            selectedAttributes.push(checkboxes[i].value);
        }
    }
    return selectedAttributes;
}

function populateRelationAttributes(relation) {
    const attributionSelectForm = document.getElementById('attribution-select-form');
    attributionSelectForm.innerHTML = '';

    let attributesList = [];
    fetch('/get-relation-attributes/' + relation)
        .then(response => response.json())
        .then(data => {
            attributesList = data;
            attributesList.forEach(attribute => {
                let checkDiv = document.createElement('div');
                let checkBox = document.createElement('input');
                checkBox.type = 'checkbox';
                checkBox.id = attribute;
                checkBox.name = 'attribute';
                checkBox.value = attribute;
                checkDiv.appendChild(checkBox);
                checkDiv.appendChild(document.createTextNode(attribute));
                attributionSelectForm.appendChild(checkDiv);
            });
        })
        .catch(error => {
            console.error(error);
        });
}

function populateRelationDropdown() {
    const relationDropdown = document.getElementById('projection-dropdown');
    
    let relationsList = [];
    fetch('/get-all-relations')
        .then(response => response.json())
        .then(data => {
            relationsList = data;
            relationsList.forEach(relation => {
                var option = document.createElement('option');
                option.value = relation;
                option.text = relation;
                relationDropdown.appendChild(option);
            });
        })
        .catch(error => {
            console.error(error);
        });
    
}

populateRelationDropdown();
renderProjectsHome();