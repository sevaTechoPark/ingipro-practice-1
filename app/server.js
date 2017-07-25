const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, 'views')));

app.listen(3000, () => {
    // eslint-disable-next-line
    console.log('Server started on localhost:3000');
});
