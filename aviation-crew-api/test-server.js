// Simple test server
const express = require('express');
const app = express();
const PORT = 7777;

app.get('/', (req, res) => {
    res.json({ message: 'Test server working!' });
});

app.listen(PORT, () => {
    console.log(`Test server started on port ${PORT}`);
});
