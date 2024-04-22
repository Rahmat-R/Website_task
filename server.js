const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static('/Library/WebServer/Documents/creative_task/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const groupsFilePath = path.join(__dirname, 'groupdData.json');
let groupsData = JSON.parse(fs.readFileSync(groupsFilePath, 'utf8'));

const loginDataPath = path.join(__dirname, 'loginData.json');
let loginData = JSON.parse(fs.readFileSync(loginDataPath, 'utf8'));

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});

app.post('/login', (req, res) => {
    const {username, password} = req.body;
    if (loginData[username] && loginData[username] === password) {
        res.json({success: true, message: 'Login successful'});
    } else {
        res.status(401).json({success: false, message: 'Login failed: Incorrect username or password'});
    }
});

app.get('/groups', (req, res) => {
    res.json(groupsData);
});


app.post('/updateAttendance', (req, res) => {
    const {groupName, name, status, color} = req.body;

    if (groupsData.groups[groupName]) {
        let memberFound = false;

        groupsData.groups[groupName].forEach(member => {
            if (member.name === name) {
                member.status = status;
                member.color = color;
                memberFound = true;
            }
        });

        if (memberFound) {
            fs.writeFileSync(groupsFilePath, JSON.stringify(groupsData, null, 2), 'utf8');
            res.json({success: true, message: 'Attendance updated successfully', data: groupsData});
        } else {
            res.status(400).json({success: false, message: 'Member not found in the specified group'});
        }
    } else {
        res.status(400).json({success: false, message: 'Invalid group'});
    }
});


app.listen(port, () => {
    console.log('Server running on port ' + port);
});
