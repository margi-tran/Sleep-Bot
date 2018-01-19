var schedule = require('node-schedule');

schedule.scheduleJob('10 03 * * *', function () {
    console.log('Scheduled Task 1');
});

schedule.scheduleJob('11 03 * * *', function () {
    console.log('Scheduled Task 2');
});
