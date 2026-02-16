import fetch from 'node-fetch';

async function checkImage() {
    const url = 'http://localhost:5000/uploads/books/02cbe054-5c5f-4f3c-b5ed-7ed0776b9054.png';
    try {
        const res = await fetch(url);
        console.log(`URL: ${url}`);
        console.log(`Status: ${res.status}`);
        console.log(`Content-Type: ${res.headers.get('content-type')}`);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

checkImage();
