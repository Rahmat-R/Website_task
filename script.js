$(document).ready(function () {
    const groupsContainer = $('#groupsContainer');
    const labelContainer = $('#labelContainer');

    let groupsData;

    $.get("/groups")
        .done(function (response) {
            groupsData = typeof response === "string" ? JSON.parse(response) : response;
            initializeUI();
        });
    function initializeUI() {
        displayGroupButton('1', 'Group 1');
        displayGroupButton('2', 'Group 2');
        displayGroupButton('cross', 'Cross Groups');
    }

    function displayGroupButton(groupId, label) {
        const groupBox = $('<button>')
            .addClass('group-button')
            .attr('data-group-id', groupId)
            .text(label);
        groupsContainer.append(groupBox);
    }

    groupsContainer.on('click', '.group-button', function () {
        const groupId = $(this).data('group-id');
        const groupMembers = groupId === 'cross' ? getCrossGroupMembers() : groupsData.groups[groupId];
        updateLabelContainer(groupMembers);
    });

    function getCrossGroupMembers() {
        return Object.values(groupsData.groups)
            .flat()
            .filter(member => member.groupId !== '1' && member.groupId !== '2');
    }

    function updateLabelContainer(groupMembers) {
        labelContainer.empty();
        groupMembers.forEach(member => {
            const memberId = 'member-' + member.name.replace(/\s+/g, '-');
            const memberLabel = $('<div>')
                .addClass('member-label')
                .css('color', member.color)
                .attr('id', memberId)
                .data('member-name', member.name)
                .data('group-id', member.groupId);

            const nameLabel = $('<span>').text(member.name);
            const absentButton = $('<button>').text('Absent').addClass('button absent');
            const pairedButton = $('<button>').text('Paired').addClass('button paired');

            memberLabel.append(nameLabel, absentButton, pairedButton);
            labelContainer.append(memberLabel);
        });
    }

    labelContainer.on('click', '.button', function () {
        const button = $(this);
        const memberLabel = button.closest('.member-label');
        const memberId = memberLabel.attr('id');
        const groupId = memberLabel.data('group-id');
        const memberName = memberId.replace('member-', '').replace(/-/g, ' ');
        const status = button.hasClass('absent') ? 'Absent' : 'Paired';
        const color = status === 'Absent' ? 'gray' : 'purple';
        const member = findMemberByNameAndGroupId(memberName, groupId);
        console.log(member)
        if (member) {
            markAttendance(member, status, color);
        }
    });

    function findMemberByNameAndGroupId(name, groupId) {
        console.log('Searching for member:', name, 'in group:', groupId);

        const member = Object.values(groupsData.groups)
            .flat()
            .find(member => member.name === name && member.groupId === groupId);

        if (member) {
            console.log('Member found:', member);
        } else {
            console.error('Member not found');
        }

        return member;
    }


    function markAttendance(member, status, color) {
        console.log("called")
        $.post("/updateAttendance", { groupName: member.groupId, name: member.name, status, color }, (data) => {
            if (data.success) {
                console.log("Attendance marked successfully");
                updateMemberUI(member, status, color);
            } else {
                console.error(data.message);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Request failed: " + textStatus);
        });
    }

    function updateMemberUI(member, status, color) {
        const memberId = 'member-' + member.name.replace(/\s+/g, '-');
        const memberLabel = $('#' + memberId);

        memberLabel.css('color', color);
        memberLabel.find('.button').removeClass('active');
        if (status === 'Absent') {
            memberLabel.find('.absent').addClass('active');
        } else if (status === 'Paired') {
            memberLabel.find('.paired').addClass('active');
        }
    }

    function displayMembers() {
        // Loop through each group and create the colored balls
        Object.entries(groupsData).forEach(([groupId, members]) => {
            members.forEach(member => {
                const colorClass = member.status === 'Absent' ? 'gray' : member.status === 'Paired' ? 'purple' : member.color;
                $(`#group${groupId}`).append(`<div class="member-ball" style="background-color: ${colorClass};"></div>`);

                // If the member is absent or paired, add them to the status list
                if (member.status === 'Absent' || member.status === 'Paired') {
                    $(`#status${groupId}`).append(`<div>${member.name} = ${member.status}</div>`);
                }
            });
        });
    }
});
