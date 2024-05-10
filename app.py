from flask import Flask, jsonify, render_template, request
from flask_restful import abort
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text

app = Flask(__name__)
CORS(app)


username = 'aaditya'
password = 'sample44'

app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{username}:{password}@localhost:3306/cpsc304'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.json.sort_keys = False


db = SQLAlchemy(app)

projects = []


def execute_query(query):
    # Determine the type of the query
    query_type = query.strip().split()[0].upper()

    sql = text(query)
    with db.engine.begin() as connection:
        try:
            result =connection.execute(sql)
        except Exception as e:
            return jsonify({"message": "Error in executing query", "error": str(e)})
        
        if query_type == 'SELECT' or query_type == 'SHOW':
            column_names = result.keys()
            results_list = []
            for row in result:
                row_dict = {column: value for column, value in zip(column_names, row)}
                results_list.append(row_dict)
            return results_list
        
        else:
            return {'rows_affected': result.rowcount}
        

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/home') 
def get_projects():

    project_names = execute_query("SELECT name, description, deadline FROM Projects ORDER BY deadline;")
    return jsonify(project_names)


@app.route('/add-project', methods=['POST'])
def add_project():
    data = request.get_json() 
    
    name = data['name']
    description = data['description']
    deadline = data['deadline']

    execute_query(f"INSERT INTO Projects (Name, Description, Deadline) VALUES \
                  ('{name}', '{description}', '{deadline}');")
    
    return jsonify({"message": "Project added successfully"})

@app.route('/delete-project', methods=['POST'])
def delete_project():
    data = request.get_json()
    project_name = data['projectName']


    execute_query(f"DELETE FROM AssignTo WHERE Name = '{project_name}';")
    execute_query("DELETE FROM Teams WHERE TeamID NOT IN (SELECT TeamID FROM AssignTo);")
    execute_query(f"DELETE FROM Projects WHERE Name = '{project_name}';")


    return jsonify({"message": "Project deleted successfully"})

@app.route('/filter-projects', methods=['POST'])
def filter_projects():
    data = request.get_json()
    filter_condition = data['filterCondition']

    try:
        filteredProjects = execute_query(f"SELECT name, description, deadline FROM Projects WHERE {filter_condition};")
        return jsonify({"result": filteredProjects, "message": "success"})
    except Exception as e:
        return jsonify({"message": "Error in filtering projects. Enter a valid condition", "error": str(e)})
        


@app.route('/get-all-relations')
def get_all_relations():
    relations = execute_query("SHOW TABLES;")
    relations = [relation['Tables_in_cpsc304'] for relation in relations]
    return jsonify(relations)

@app.route('/get-relation-attributes/<relation>')
def get_relation_attributes(relation):
    attributes = execute_query(f"\
                               select COLUMN_NAME \
                               from INFORMATION_SCHEMA.COLUMNS \
                               where TABLE_NAME='{relation}';\
                ")
    return jsonify([attribute['COLUMN_NAME'] for attribute in attributes])

@app.route('/get-avg-team-members')
def get_avg_team_members():
    avg_team_members = execute_query(" \
                                    SELECT avg(sub.count) AS AverageTeamSize \
                                    FROM  AssignTo a, ( \
                                        SELECT t.TeamID, count(DISTINCT EmployeeID) AS count \
                                        FROM Teams t, TeamMembers tm \
                                        WHERE t.TeamID = tm.TeamID \
                                        GROUP BY t.TeamID \
                                        ) AS sub \
                                    WHERE a.TeamID = sub.TeamID \
                                    ")
    print(avg_team_members[0])
    if avg_team_members[0]['AverageTeamSize'] == None:
        return jsonify([{'AverageTeamSize': 0}]) 
    else:
        return jsonify(avg_team_members)
    # print(avg_team_members)
    # return jsonify(avg_team_members)

@app.route('/get-all-teams')
def get_all_team_members():

    all_teams = execute_query(" \
                            SELECT t.TeamID \
                            FROM Teams t \
                            WHERE NOT EXISTS ( \
                            SELECT p.Name \
                            FROM Projects p \
                            WHERE NOT EXISTS ( \
                                SELECT * \
                                FROM AssignTo a \
                                WHERE a.TeamID = t.TeamID AND a.Name = p.Name \
                            ) \
                            ); \
                            ")  
                            
    if len(all_teams) == 0:
        return jsonify([])
    else:
        return jsonify(all_teams)

@app.route('/get-projection/<relation>/<attributes>')
def get_projection(relation, attributes):
    attributes = [attribute.strip() for attribute in attributes.split('+')]
    attributes = ', '.join(attributes)
    projection = execute_query(f"\
                               SELECT {attributes} \
                               FROM {relation} \
                               ")
    return jsonify(projection)



@app.route('/project-<project>/')
def get_project_data(project):

    return render_template('project.html', project=project)

@app.route('/project-<project>/get-project-info')
def get_project_info(project):
    project_info = execute_query(f"SELECT name, description, deadline FROM Projects WHERE Name = '{project}';")
    return jsonify(project_info[0])

@app.route('/project-<project>/get-task-info')
def get_task_info(project):
    task_info = execute_query(f" \
                              SELECT t3.TaskID, t1.Deadline, t3.Description \
                              FROM PostNormTasksR3 t3, Projects p, PostNormTasksR1 t1, PostNormTasksR2 t2 \
                              WHERE \
                                p.Name = t3.ProjectName AND \
                                p.Name = '{project}' AND \
                                t1.Priority = t2.Priority AND \
                                t2.Description = t3.Description;")
    
    return jsonify(task_info)

@app.route('/project-<project>/get-task-with-numbugs')
def get_task_with_numbugs(project):
    print("GETTING TASK INFO")
    
    try:
        task_info = execute_query(f" \
                            SELECT \
                                t.TaskID, \
                                t2.Deadline, \
                                t.Description, \
                                COUNT(b.BugID) AS NumberOfBugs \
                            FROM \
                                PostNormTasksR3 t \
                            LEFT JOIN TaskHaveBugs b ON t.TaskID = b.TaskID \
                            JOIN PostNormTasksR2 t3 ON t3.Description = t.Description \
                            JOIN PostNormTasksR1 t2 ON t2.Priority = t3.Priority \
                            JOIN Projects p ON p.Name = t.ProjectName \
                            WHERE \
                                p.Name = '{project}' \
                            GROUP BY \
                                t.TaskID, t2.Deadline, t.Description; \
                            ")
        return jsonify({"result": task_info, "message": "success"})
    except Exception as e:
        return jsonify({"message": "Error in getting task info", "error": str(e)})

@app.route('/project-<project>/get-reported-by', methods=['POST'])
def get_reported_by(project):
    employee_id = request.get_json()['employee_id']

    if not EmployeeID_exists(employee_id):
        return jsonify({"message": "Employee ID does not exist"})
    else:
        reported_by = execute_query(f"\
                                    SELECT BugID, Description, Severity \
                                    FROM Bugs, ReportedBy \
                                    WHERE BugID = ID and EmployeeID = '{employee_id}' \
                                    ")
        return jsonify({"message": "success", "result": reported_by})

@app.route('/project-<project>/get-bugs')
def get_bugs(project):
    bugs = execute_query(f" \
                         SELECT BugID, Description \
                         FROM TaskHaveBugs, Bugs \
                         WHERE ProjectName = '{project}' and BugID = ID \
                         ")
    return jsonify(bugs)

@app.route('/project-<project>/get-all-team-members')
def get_team_members(project):
    team_members = execute_query(f" \
                                 SELECT tm.TeamID, tm.EmployeeID, tm.Name, tm.Seniority \
                                 FROM TeamMembers tm, Teams t, AssignTo a, Projects p \
                                 WHERE tm.TeamID = t.TeamID AND a.TeamID = t.TeamID AND a.Name = p.Name AND p.Name = '{project}'; \
                                ")

    return jsonify(team_members)

@app.route('/project-<project>/get-tasks-with-filter-bugs', methods=['POST'])
def get_tasks_with_more_than_5_bugs(project):
    condition = request.get_json()['condition']
    number_bugs = request.get_json()['number_bugs']

    tasks_with_filter_bugs = execute_query(f" \
                        SELECT \
                            t.TaskID \
                        FROM \
                            PostNormTasksR3 t \
                        LEFT JOIN TaskHaveBugs b ON t.TaskID = b.TaskID \
                        JOIN Projects p ON p.Name = t.ProjectName \
                        WHERE \
                            p.Name = '{project}' \
                        GROUP BY \
                            t.TaskID \
                        HAVING COUNT(b.BugID) {condition} {number_bugs}; \
                        ")
    return jsonify({"message": "success", "result": tasks_with_filter_bugs})

def EmployeeID_exists(emplid):
    EmployeeID_exists = execute_query(f"SELECT COUNT(*) FROM TeamMembers WHERE EmployeeID = {emplid};")
    return EmployeeID_exists[0]['COUNT(*)'] > 0

def teamID_exists(teamID):
    teamID_exists = execute_query(f"SELECT COUNT(*) FROM Teams WHERE TeamID = {teamID};")
    return teamID_exists[0]['COUNT(*)'] > 0

def teamId_assigned_to_other_project(teamID, projectName):
    teamId_assigned_to_project = execute_query(f"SELECT COUNT(*) FROM AssignTo WHERE TeamID = {teamID} AND Name <> '{projectName}';")
    return teamId_assigned_to_project[0]['COUNT(*)'] > 0

@app.route('/project-<project>/insert-team-member', methods=['POST'])
def insert_team_member(project):
    data = request.get_json()
    teamid = data['teamid']
    emplid = data['emplid']
    name = data['name']
    seniority = data['seniority']

    if EmployeeID_exists(emplid):
        return jsonify({"message": "Employee ID already exists"})

    else:
        if not teamID_exists(teamid):
            execute_query(f"INSERT INTO Teams (TeamID, TeamSize, TeamFunction) VALUES \
                        ('{teamid}', 1, NULL);")
            
            execute_query(f"INSERT INTO TeamMembers (TeamID, EmployeeID, Name, Seniority) VALUES \
                        ('{teamid}', '{emplid}', '{name}', '{seniority}');")
            
            execute_query(f"INSERT INTO AssignTo (Name, TeamID) VALUES \
                        ('{project}', '{teamid}');")
            
            return jsonify({"message": "success"})
            
        elif teamId_assigned_to_other_project(teamid, project):

            return jsonify({"message": "Team ID already assigned to another project"})
        
            
        else:
            execute_query(f"INSERT INTO TeamMembers (TeamID, EmployeeID, Name, Seniority) VALUES \
                        ('{teamid}', '{emplid}', '{name}', '{seniority}');")
            
            execute_query(f"UPDATE Teams SET TeamSize = TeamSize + 1 WHERE TeamID = '{teamid}';")

            return jsonify({"message": "success"})
        
def get_team_of_employee(employee_id):
    team_id = execute_query(f"SELECT TeamID FROM TeamMembers WHERE EmployeeID = {employee_id};")
    return team_id[0]['TeamID']

@app.route('/project-<project>/delete-team-member', methods=['POST'])
def delete_team_member(project):
    data = request.get_json()
    employee_id = data['employee_id']

    if not EmployeeID_exists(employee_id):
        return jsonify({"message": "Employee ID does not exist"})

    else:
        execute_query(f" \
                      UPDATE Teams \
                      SET TeamSize = TeamSize - 1 \
                      WHERE TeamID = ( \
                            SELECT TeamID \
                            FROM TeamMembers \
                            WHERE EmployeeID = '{employee_id}' \
                    ); \
                ")

        execute_query(f"DELETE FROM TeamMembers WHERE EmployeeID = '{employee_id}';")
        
        execute_query(f"DELETE FROM Teams WHERE TeamSize = 0;")
         
        return jsonify({"message": "success"})
    
def get_old_team_member_values(employee_id):
    team_id = execute_query(f"SELECT TeamID, Name, Seniority FROM TeamMembers WHERE EmployeeID = {employee_id};")
    return team_id[0]

    
@app.route('/project-<project>/update-team-member', methods=['POST'])
def update_team_member(project):
    data = request.get_json()
    emplid = data['emplid']
    tmid = data['tmid']
    name = data['name']
    seniority = data['seniority']

    tmid = get_old_team_member_values(emplid)['TeamID'] if tmid == '' else tmid
    name = get_old_team_member_values(emplid)['Name'] if name == '' else name
    seniority = get_old_team_member_values(emplid)['Seniority'] if seniority == '' else seniority

    if not EmployeeID_exists(emplid):
        return jsonify({"message": "Employee ID does not exist"})

    else:
        if not teamID_exists(tmid):
            return jsonify({"message": "Team ID does not exist"})
        

        else:
            execute_query(f"UPDATE Teams SET TeamSize = TeamSize - 1 WHERE TeamID IN (SELECT TeamID FROM TeamMembers WHERE EmployeeID = {emplid});")
            execute_query(f"UPDATE Teams SET TeamSize = TeamSize + 1 WHERE TeamID = {tmid};")
            execute_query(f"UPDATE TeamMembers SET TeamID = {tmid}, Name = '{name}', Seniority = {seniority} WHERE EmployeeID = {emplid};")

            execute_query(f"DELETE FROM Teams WHERE TeamSize = 0;")

            return jsonify({"message": "success"})


    

if __name__ == '__main__':
    print("Starting server...")

    app.run(debug=True)

    

