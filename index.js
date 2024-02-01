const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your-secret-key'; // Replace with a strong, unique secret key

// Declare global variable for user data
global.users = [];
global.patients = [
  { uin: '0012435987', mrn: 'P3456145', name: 'John Doe', phone: '1234567890' },
  // add more data 
];

app.use(cors());
app.use(bodyParser.json());

//Login and Signup validation

app.post('/api/signup', async (req, res) => {
    try {
      const { name, email, password } = req.body;
  
      // Check if the email already exists
      if (global.users.some(user => user.email === email)) {
        return res.status(400).json({ message: 'Email or phone already exists' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Store user details (with hashed password)
      global.users.push({ name, email, passwordHash: hashedPassword });
  
      res.json({ message: 'Signup successful' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find the user by email
      const user = global.users.find(u => u.email === email);
  
      // Check if the user exists and verify the password
      if (user && await bcrypt.compare(password, user.passwordHash)) {
        // Generate a JWT token
        const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '1h' });
  
        // Do not include the token in the response, only for demonstration
        // In a real system, the token should be securely stored on the client side (e.g., in an HTTP-only cookie)
        res.json({ message: 'Login successful', token });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


  //main functionalities

  // const patients = [
    
  //   // Add more sample patient data as needed
  // ];
  
  const bookedRooms = [];
  
  // Middleware to log incoming requests
  app.use((req, res, next) => {
    console.log(`Received ${req.method} request at ${req.url}`);
    next();
  });
  
  //Route to verify UIN
  app.post('/api/verify-uin', (req, res) => {
    const { uin } = req.body;
    console.log('Received UIN:', uin);

    const patient = global.patients.find(p => p.uin === uin);

    if (patient) {
        res.status(200).json({ success: true, patient });
    } else {
        res.status(404).json({ success: false, message: 'Patient not found' });
    }
});

// Route to verify MRN
app.post('/api/verify-mrn', (req, res) => {
    const { uin, mrnLastThreeDigits } = req.body;
    console.log('Received UIN:', uin);

    const patient = global.patients.find(p => p.uin === uin && p.mrn.endsWith(mrnLastThreeDigits));

    if (patient) {
        res.status(200).json({ success: true, patient });
    } else {
        res.status(404).json({ success: false, message: 'Patient not found' });
    }
});

app.get('/api/get-patient-data', (req, res) => {
  const { uin } = req.query;

  // Find patient data based on UIN
  const patient = global.patients.find(p => p.uin === uin);

  if (patient) {
      res.json(patient);
  } else {
      res.status(404).json({ error: 'Patient not found' });
  }
});


  
  // Route to book a new room
  app.post('/api/book-room', (req, res) => {
    const bookingData = req.body;
  
    // Validate the booking data (add more validation as needed)
  
    // For simplicity, assuming room numbers are incremental
    const roomNumber = bookedRooms.length + 1;
  
    const bookedRoom = {
      roomNumber,
      patientName: bookingData.patient.name,
      phone: bookingData.patient.phone,
      roomType: bookingData.roomType,
      admissionDate: bookingData.admissionDate,
      numberOfDays: bookingData.numberOfDays,
      totalCost: calculateTotalCost(bookingData.roomType, bookingData.numberOfDays),
    };
  
    bookedRooms.push(bookedRoom);
  
    // Trigger message to patient (in a real system, this would involve an external service)
    console.log(`Message sent to ${bookingData.patient.phone}: Room booked successfully`);
  
    res.status(201).json({ message: 'Room booked successfully', bookedRoom });
  });
  
  // Route to get the list of booked rooms
  app.get('/api/booked-rooms', (req, res) => {
    res.json(bookedRooms);
  });
  
  // Route to cancel a booked room

  function findBookedRoomByNumber(roomNumber) {
    return bookedRooms.find(room => room.roomNumber === roomNumber);
  }
  app.post('/api/cancel-room', (req, res) => {
    const { roomNumber, uin, cancellationReason } = req.body;

    // Verify that the room exists
    const roomToCancel = findBookedRoomByNumber(roomNumber);

    if (roomToCancel) {
        // Implement your cancellation logic here
        // Remove the room from the bookedRooms array
        const index = bookedRooms.indexOf(roomToCancel);
        bookedRooms.splice(index, 1);

        // Trigger any cancellation messages or actions

        res.json({ message: 'Room booking cancelled successfully', cancelledRoom: roomToCancel });
    } else {
        res.status(404).json({ message: 'Room not found' });
    }
});

  
  // Function to calculate total cost based on room type and number of days
  function calculateTotalCost(roomType, numberOfDays) {
    // Add your logic to calculate cost based on room type and duration
    // For simplicity, assuming a fixed cost for now
    if(roomType === 'Special'){
      const costPerDay = 1200;
      return costPerDay * numberOfDays;
    }
    else if(roomType === 'Class A'){
      const costPerDay = 1000;
      return costPerDay * numberOfDays;
    }
    else if(roomType === 'Class B'){
      const costPerDay = 800;
      return costPerDay * numberOfDays;
    }
    else if(roomType === 'Class C'){
      const costPerDay = 700;
      return costPerDay * numberOfDays;
    }
    else{
      const costPerDay = 600;
      return costPerDay * numberOfDays;
    }

  }
  
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
  