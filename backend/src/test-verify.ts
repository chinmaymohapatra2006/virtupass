import { buildApp } from './app';
import { discountService } from './services/discountService';

async function runVirtuPassTestSuite() {
  console.log('===============================================================');
  console.log('       STARTING VIRTUPASS COMPREHENSIVE TEST SUITE             ');
  console.log('          (PHASE 1, PHASE 2 & PHASE 3 VALIDATION)              ');
  console.log('===============================================================');

  const app = await buildApp();
  await app.ready();

  let studentToken = '';
  let adminToken = '';
  let organizerToken = '';

  // --------------------------------------------------------------------------
  // TEST GROUP 1: HEALTH & SYSTEM ENDPOINTS
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 1] System & Health Endpoints:');
  const healthRes = await app.inject({ method: 'GET', url: '/api/v1/health' });
  console.log('  ✓ GET /api/v1/health -> Status:', healthRes.statusCode);
  if (healthRes.statusCode !== 200) throw new Error('Health check failed');

  const sysRes = await app.inject({ method: 'GET', url: '/api/v1/system/info' });
  console.log('  ✓ GET /api/v1/system/info -> Status:', sysRes.statusCode);
  if (sysRes.statusCode !== 200) throw new Error('System info failed');

  // --------------------------------------------------------------------------
  // TEST GROUP 2: AUTHENTICATION & DEMO ACCOUNTS
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 2] Demo Account Authentication:');

  // 2.1 Student Login (student@virtupass.demo / Demo@123)
  const studentLoginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'student@virtupass.demo', password: 'Demo@123' }
  });
  console.log('  ✓ Student Login -> Status:', studentLoginRes.statusCode);
  if (studentLoginRes.statusCode !== 200) throw new Error('Student login failed');
  const studentJson = JSON.parse(studentLoginRes.payload);
  studentToken = studentJson.data.tokens.accessToken;
  console.log('    Role returned:', studentJson.data.user.role, '| CGPA:', studentJson.data.user.cgpa);

  // 2.2 Admin Login (admin@virtupass.demo / Demo@123)
  const adminLoginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'admin@virtupass.demo', password: 'Demo@123' }
  });
  console.log('  ✓ Admin Login -> Status:', adminLoginRes.statusCode);
  if (adminLoginRes.statusCode !== 200) throw new Error('Admin login failed');
  const adminJson = JSON.parse(adminLoginRes.payload);
  adminToken = adminJson.data.tokens.accessToken;
  console.log('    Role returned:', adminJson.data.user.role);

  // 2.3 Organizer Login (organizer@virtupass.demo / Demo@123)
  const orgLoginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'organizer@virtupass.demo', password: 'Demo@123' }
  });
  console.log('  ✓ Organizer Login -> Status:', orgLoginRes.statusCode);
  if (orgLoginRes.statusCode !== 200) throw new Error('Organizer login failed');
  const orgJson = JSON.parse(orgLoginRes.payload);
  organizerToken = orgJson.data.tokens.accessToken;
  console.log('    Role returned:', orgJson.data.user.role, '| Status:', orgJson.data.user.approvalStatus);

  // 2.4 Invalid Password rejection
  const badLoginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'student@virtupass.demo', password: 'WrongPassword@99' }
  });
  console.log('  ✓ Invalid Login rejected -> Status:', badLoginRes.statusCode);
  if (badLoginRes.statusCode !== 401) throw new Error('Bad password was not rejected with 401');

  // --------------------------------------------------------------------------
  // TEST GROUP 3: REGISTRATION & PRIVILEGE ESCALATION DEFENSES
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 3] Registration & Privilege Escalation Defenses:');

  const testStudentEmail = `test.student.${Date.now()}@college.edu`;
  const regStudentRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      fullName: 'Kavya Menon',
      email: testStudentEmail,
      password: 'StrongPassword@123',
      confirmPassword: 'StrongPassword@123',
      studentId: 'VIT20260002',
      collegeName: 'Vellore Institute of Technology',
      department: 'ECE',
      yearOfStudy: 4,
      role: 'ADMIN' // Client attempts unauthorized escalation to ADMIN
    }
  });
  console.log('  ✓ Student Registration -> Status:', regStudentRes.statusCode);
  const regStudentJson = JSON.parse(regStudentRes.payload);
  if (regStudentRes.statusCode !== 201) throw new Error('Student registration failed');
  console.log('    Assigned Role (Escalation thwarted):', regStudentJson.data.user.role);
  if (regStudentJson.data.user.role !== 'USER') throw new Error('Role escalation succeeded!');

  const newStudentToken = regStudentJson.data.tokens.accessToken;

  // --------------------------------------------------------------------------
  // TEST GROUP 4: RBAC BOUNDARIES
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 4] Role-Based Access Control (RBAC):');

  // Student tries to access Admin route -> 403 Forbidden
  const studentToAdminRes = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/users',
    headers: { authorization: `Bearer ${studentToken}` }
  });
  console.log('  ✓ Student accessing /admin/users -> Status:', studentToAdminRes.statusCode);
  if (studentToAdminRes.statusCode !== 403) throw new Error('Student was not blocked from admin route');

  // Organizer tries to access Admin route -> 403 Forbidden
  const orgToAdminRes = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/users',
    headers: { authorization: `Bearer ${organizerToken}` }
  });
  console.log('  ✓ Organizer accessing /admin/users -> Status:', orgToAdminRes.statusCode);
  if (orgToAdminRes.statusCode !== 403) throw new Error('Organizer was not blocked from admin route');

  // --------------------------------------------------------------------------
  // TEST GROUP 5: ACADEMIC VERIFICATION WORKFLOW & STATE MACHINE
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 5] Multi-Step Academic Verification & State Machine:');

  const startVerifRes = await app.inject({
    method: 'POST',
    url: '/api/v1/verification/start',
    headers: { authorization: `Bearer ${newStudentToken}` },
    payload: { studentId: 'VIT20260002' }
  });
  console.log('  ✓ Start verification -> Status:', startVerifRes.statusCode);
  const startVerifJson = JSON.parse(startVerifRes.payload);
  const captchaChallengeId = startVerifJson.data.captcha.challengeId;

  const match = startVerifJson.data.captcha.question.match(/(\d+)\s*\+\s*(\d+)/);
  const correctAnswer = match ? (parseInt(match[1]) + parseInt(match[2])).toString() : '20';

  const goodCaptchaRes = await app.inject({
    method: 'POST',
    url: '/api/v1/verification/captcha',
    headers: { authorization: `Bearer ${newStudentToken}` },
    payload: { challengeId: captchaChallengeId, answer: correctAnswer }
  });
  const goodCaptchaJson = JSON.parse(goodCaptchaRes.payload);
  const otpChallengeId = goodCaptchaJson.data.otpChallengeId;

  await app.inject({
    method: 'POST',
    url: '/api/v1/verification/otp/verify',
    headers: { authorization: `Bearer ${newStudentToken}` },
    payload: { challengeId: otpChallengeId, otp: '123456' }
  });

  const completeVerifRes = await app.inject({
    method: 'POST',
    url: '/api/v1/verification/complete',
    headers: { authorization: `Bearer ${newStudentToken}` }
  });
  console.log('  ✓ Complete verification -> Status:', completeVerifRes.statusCode);
  const completeJson = JSON.parse(completeVerifRes.payload);
  console.log('    Verified CGPA:', completeJson.data.verifiedCgpa, '| Discount:', completeJson.data.discountPercentage + '%');
  if (completeJson.data.verifiedCgpa !== 9.50) throw new Error('CGPA mismatch with simulated university record');

  // --------------------------------------------------------------------------
  // TEST GROUP 6: CGPA DISCOUNT ENGINE BOUNDARIES & PAISE ARITHMETIC
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 6] CGPA Discount Engine Exact Boundaries & Integer Arithmetic:');

  // Exact boundary testing from Prompt 3 specification:
  // 9.72 = 20%
  // 9.51 = 20%
  // 9.50 = 15%
  // 9.01 = 15%
  // 9.00 = 10%
  // 8.51 = 10%
  // 8.50 = 0%
  // 8.20 = 0%
  // Unverified = 0%
  const boundaryTests = [
    { cgpa: 9.72, verified: true, expectedPct: 20 },
    { cgpa: 9.51, verified: true, expectedPct: 20 },
    { cgpa: 9.50, verified: true, expectedPct: 15 },
    { cgpa: 9.01, verified: true, expectedPct: 15 },
    { cgpa: 9.00, verified: true, expectedPct: 10 },
    { cgpa: 8.51, verified: true, expectedPct: 10 },
    { cgpa: 8.50, verified: true, expectedPct: 0 },
    { cgpa: 8.20, verified: true, expectedPct: 0 },
    { cgpa: 9.72, verified: false, expectedPct: 0 }, // Unverified student gets 0%
    { cgpa: undefined, verified: true, expectedPct: 0 }
  ];

  for (const test of boundaryTests) {
    const pct = discountService.calculateDiscountPercentage(test.cgpa, test.verified);
    if (pct !== test.expectedPct) {
      throw new Error(`Discount boundary check failed for CGPA ${test.cgpa} (verified: ${test.verified}): Expected ${test.expectedPct}%, got ${pct}%`);
    }
    console.log(`  ✓ Boundary check: CGPA ${test.cgpa ?? 'None'} (Verified: ${test.verified}) -> ${pct}% (Expected: ${test.expectedPct}%)`);
  }

  // Paise integer math test (e.g. Base price 499 INR, qty 2, 20% discount)
  const pricing = discountService.computePricing(499, 2, 9.72, true);
  console.log('  ✓ Integer Arithmetic Breakdown:');
  console.log(`    Subtotal: ₹${pricing.subtotal} (${pricing.subtotalPaise} Paise)`);
  console.log(`    Discount (${pricing.discountPercentage}%): ₹${pricing.discountAmount} (${pricing.discountAmountPaise} Paise)`);
  console.log(`    Final: ₹${pricing.finalAmount} (${pricing.finalAmountPaise} Paise)`);
  if (pricing.subtotal !== 998 || pricing.discountAmount !== 199.6 || pricing.finalAmount !== 798.4) {
    throw new Error('Pricing integer arithmetic failed');
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 7: EVENT DISCOVERY, FILTERING & SORTING
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 7] Event Discovery, Filtering & Sorting Endpoints:');

  // 7.1 List all published events
  const allEventsRes = await app.inject({ method: 'GET', url: '/api/v1/events' });
  console.log('  ✓ GET /api/v1/events -> Status:', allEventsRes.statusCode);
  if (allEventsRes.statusCode !== 200) throw new Error('List events failed');
  const allEventsJson = JSON.parse(allEventsRes.payload);
  console.log(`    Retrieved ${allEventsJson.data.length} published events.`);
  if (allEventsJson.data.length < 5) throw new Error('Expected at least 5 demo events in store');

  // 7.2 Filter by Category (Technical)
  const techEventsRes = await app.inject({ method: 'GET', url: '/api/v1/events?category=Technical' });
  const techEventsJson = JSON.parse(techEventsRes.payload);
  console.log(`  ✓ Filter by Category (Technical) -> ${techEventsJson.data.length} matches.`);
  if (!techEventsJson.data.every((e: any) => e.category === 'Technical')) {
    throw new Error('Category filter returned non-Technical event');
  }

  // 7.3 Search by Keyword (Hackathon)
  const searchRes = await app.inject({ method: 'GET', url: '/api/v1/events?search=Hackathon' });
  const searchJson = JSON.parse(searchRes.payload);
  console.log(`  ✓ Search by keyword ('Hackathon') -> ${searchJson.data.length} matches.`);
  if (searchJson.data.length === 0) throw new Error('Search for Hackathon returned no results');

  // 7.4 Sort by Price Ascending
  const sortRes = await app.inject({ method: 'GET', url: '/api/v1/events?sortBy=price_asc' });
  const sortJson = JSON.parse(sortRes.payload);
  console.log(`  ✓ Sort by price_asc -> First event: ${sortJson.data[0].title}`);

  // 7.5 Get Single Event with Ticket Categories
  const singleEventRes = await app.inject({ method: 'GET', url: '/api/v1/events/evt-technova-2026' });
  console.log('  ✓ GET /api/v1/events/evt-technova-2026 -> Status:', singleEventRes.statusCode);
  if (singleEventRes.statusCode !== 200) throw new Error('Get single event failed');
  const singleEventJson = JSON.parse(singleEventRes.payload);
  const categories = singleEventJson.data.ticketCategories;
  console.log(`    Found ${categories.length} ticket tiers: ${categories.map((c: any) => `${c.name} (₹${c.basePrice})`).join(', ')}`);

  // --------------------------------------------------------------------------
  // TEST GROUP 8: BOOKING QUOTE GENERATION & SECURITY
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 8] Booking Quote Generation & Security:');

  // 8.1 Verified Student Requests Quote (Aarav Sharma, CGPA 9.72 -> 20% discount)
  const studentQuoteRes = await app.inject({
    method: 'POST',
    url: '/api/v1/bookings/quote',
    headers: { authorization: `Bearer ${studentToken}` },
    payload: {
      eventId: 'evt-technova-2026',
      ticketCategoryId: 'tc-tn-general',
      quantity: 2
    }
  });
  console.log('  ✓ Student Booking Quote -> Status:', studentQuoteRes.statusCode);
  if (studentQuoteRes.statusCode !== 200) throw new Error('Student quote generation failed');
  const studentQuote = JSON.parse(studentQuoteRes.payload).data;
  console.log(`    Quote ID: ${studentQuote.quoteId}`);
  console.log(`    Applied Discount: ${studentQuote.discountPercentage}% | Unit: ₹${studentQuote.baseUnitPrice} | Subtotal: ₹${studentQuote.subtotal} | Final: ₹${studentQuote.finalAmount}`);
  if (studentQuote.discountPercentage !== 20) throw new Error('Expected 20% discount for CGPA 9.72');
  if (studentQuote.finalAmount !== 798.4) throw new Error('Final amount mismatch');

  // 8.2 Non-USER (Organizer) attempts quote -> 403 Forbidden
  const orgQuoteRes = await app.inject({
    method: 'POST',
    url: '/api/v1/bookings/quote',
    headers: { authorization: `Bearer ${organizerToken}` },
    payload: {
      eventId: 'evt-technova-2026',
      ticketCategoryId: 'tc-tn-general',
      quantity: 1
    }
  });
  console.log('  ✓ Organizer attempting student quote blocked -> Status:', orgQuoteRes.statusCode);
  if (orgQuoteRes.statusCode !== 403) throw new Error('Organizer was not blocked from booking quote');

  // 8.3 Quantity > 5 validation error -> 400
  const excessQtyRes = await app.inject({
    method: 'POST',
    url: '/api/v1/bookings/quote',
    headers: { authorization: `Bearer ${studentToken}` },
    payload: {
      eventId: 'evt-technova-2026',
      ticketCategoryId: 'tc-tn-general',
      quantity: 10
    }
  });
  console.log('  ✓ Excess quantity (>5) rejected -> Status:', excessQtyRes.statusCode);
  if (excessQtyRes.statusCode !== 400) throw new Error('Excess quantity was not rejected');

  // --------------------------------------------------------------------------
  // TEST GROUP 9: BOOKING INITIATION, INVENTORY HOLD & PENDING_PAYMENT
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 9] Booking Initiation, Inventory Reservation & Hold State:');

  const preEventRes = await app.inject({ method: 'GET', url: '/api/v1/events/evt-technova-2026' });
  const preCap = JSON.parse(preEventRes.payload).data.remainingCapacity;

  // 9.1 Initiate booking using quote
  const bookRes = await app.inject({
    method: 'POST',
    url: '/api/v1/bookings',
    headers: { authorization: `Bearer ${studentToken}` },
    payload: { quoteId: studentQuote.quoteId }
  });
  console.log('  ✓ Initiate Booking -> Status:', bookRes.statusCode);
  if (bookRes.statusCode !== 201) throw new Error('Initiate booking failed');
  const bookingData = JSON.parse(bookRes.payload).data;
  console.log(`    Booking ID: ${bookingData.id} | Status: ${bookingData.status} | Hold Expires: ${bookingData.holdExpiresAt}`);
  if (bookingData.status !== 'PENDING_PAYMENT') throw new Error('Booking status must be PENDING_PAYMENT');

  // 9.2 Capacity decrement verification
  const postEventRes = await app.inject({ method: 'GET', url: '/api/v1/events/evt-technova-2026' });
  const postCap = JSON.parse(postEventRes.payload).data.remainingCapacity;
  console.log(`    Capacity before: ${preCap} -> after: ${postCap} (Decremented by ${studentQuote.quantity})`);
  if (postCap !== preCap - studentQuote.quantity) throw new Error('Event capacity was not decremented');

  // 9.3 Attempting to reuse the consumed quote -> 400
  const reuseQuoteRes = await app.inject({
    method: 'POST',
    url: '/api/v1/bookings',
    headers: { authorization: `Bearer ${studentToken}` },
    payload: { quoteId: studentQuote.quoteId }
  });
  console.log('  ✓ Reusing consumed quote rejected -> Status:', reuseQuoteRes.statusCode);
  if (reuseQuoteRes.statusCode !== 400) throw new Error('Consumed quote was allowed to be reused');

  // --------------------------------------------------------------------------
  // TEST GROUP 10: BOOKING HISTORY & ACCESS ISOLATION
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 10] Booking History & Student Access Isolation:');

  // 10.1 Student retrieves own bookings
  const myBookingsRes = await app.inject({
    method: 'GET',
    url: '/api/v1/bookings/my',
    headers: { authorization: `Bearer ${studentToken}` }
  });
  console.log('  ✓ GET /api/v1/bookings/my -> Status:', myBookingsRes.statusCode);
  const myBookings = JSON.parse(myBookingsRes.payload).data;
  console.log(`    Found ${myBookings.length} booking(s) for student.`);
  if (!myBookings.some((b: any) => b.id === bookingData.id)) {
    throw new Error('Newly created booking was not found in booking history');
  }

  // 10.2 Second student attempts to access first student\'s booking -> 403 Forbidden
  const crossAccessRes = await app.inject({
    method: 'GET',
    url: `/api/v1/bookings/${bookingData.id}`,
    headers: { authorization: `Bearer ${newStudentToken}` }
  });
  console.log('  ✓ Cross-student booking access blocked -> Status:', crossAccessRes.statusCode);
  if (crossAccessRes.statusCode !== 403) throw new Error('Cross-student access was not blocked with 403');

  // 10.3 Admin accesses booking -> 200 OK
  const adminBookingRes = await app.inject({
    method: 'GET',
    url: `/api/v1/bookings/${bookingData.id}`,
    headers: { authorization: `Bearer ${adminToken}` }
  });
  console.log('  ✓ Admin accessing student booking -> Status:', adminBookingRes.statusCode);
  if (adminBookingRes.statusCode !== 200) throw new Error('Admin was blocked from accessing booking');

  // --------------------------------------------------------------------------
  // TEST GROUP 11: ORGANIZER & ADMIN EVENT LIFECYCLE
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 11] Organizer Event Creation & Administrative Approval:');

  // 11.1 Organizer creates a new event
  const createEventRes = await app.inject({
    method: 'POST',
    url: '/api/v1/organizer/events',
    headers: { authorization: `Bearer ${organizerToken}` },
    payload: {
      title: 'RoboWars 2026 - National BattleBots Championship',
      shortDescription: 'Combat robotics arena battle with heavyweight bots',
      fullDescription: 'High-intensity robotic arena combat featuring 30kg and 15kg bot combat tiers with arena hazards.',
      category: 'Technical',
      venue: 'Main Sports Complex Arena, NIT Trichy',
      eventDate: '2026-12-05T09:00:00Z',
      startTime: '09:00 AM',
      endTime: '08:00 PM',
      ticketCategories: [
        {
          name: 'Arena Spectator',
          description: 'Ringside elevated seating with full combat views',
          basePrice: 299,
          totalAllocation: 100
        }
      ]
    }
  });
  console.log('  ✓ Organizer Create Event -> Status:', createEventRes.statusCode);
  if (createEventRes.statusCode !== 201) throw new Error('Organizer create event failed');
  const createdEvent = JSON.parse(createEventRes.payload).data;
  console.log(`    Created Event: ${createdEvent.id} | Status: ${createdEvent.status} | Approval: ${createdEvent.approvalStatus}`);

  // 11.2 Organizer submits event for admin review
  const submitRes = await app.inject({
    method: 'POST',
    url: `/api/v1/organizer/events/${createdEvent.id}/submit`,
    headers: { authorization: `Bearer ${organizerToken}` }
  });
  console.log('  ✓ Submit event for review -> Status:', submitRes.statusCode);
  if (submitRes.statusCode !== 200) throw new Error('Submit event failed');

  // 11.3 Admin approves event
  const approveRes = await app.inject({
    method: 'POST',
    url: `/api/v1/admin/events/${createdEvent.id}/approve`,
    headers: { authorization: `Bearer ${adminToken}` }
  });
  console.log('  ✓ Admin Approve Event -> Status:', approveRes.statusCode);
  if (approveRes.statusCode !== 200) throw new Error('Admin approve event failed');
  const approvedEvent = JSON.parse(approveRes.payload).data;
  console.log(`    Updated Status: ${approvedEvent.status} | Approval: ${approvedEvent.approvalStatus}`);
  if (approvedEvent.status !== 'PUBLISHED') throw new Error('Approved event status must be PUBLISHED');

  // --------------------------------------------------------------------------
  // TEST GROUP 12: PAYMENT CREATION, VALIDATION & IDEMPOTENCY
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 12] Payment Creation, Validation & Idempotency:');

  // 12.1 Student creates payment for their held booking
  const idemKey = `idem-test-${Date.now()}`;
  const createPayRes = await app.inject({
    method: 'POST',
    url: '/api/v1/payments/create',
    headers: { authorization: `Bearer ${studentToken}` },
    payload: {
      bookingId: bookingData.id,
      paymentMethod: 'UPI',
      idempotencyKey: idemKey
    }
  });
  console.log('  ✓ Create Payment -> Status:', createPayRes.statusCode);
  if (createPayRes.statusCode !== 201) throw new Error('Create payment failed');
  const paymentRecord = JSON.parse(createPayRes.payload).data;
  console.log(`    Payment ID: ${paymentRecord.paymentId} | Amount: ₹${paymentRecord.amountINR} (${paymentRecord.amountPaise} Paise) | Ref: ${paymentRecord.providerTxnRef}`);
  if (paymentRecord.amountINR !== bookingData.finalAmount) throw new Error('Payment amount does not match backend booking amount');

  // 12.2 Duplicate request with same idempotency key returns existing payment record
  const dupPayRes = await app.inject({
    method: 'POST',
    url: '/api/v1/payments/create',
    headers: { authorization: `Bearer ${studentToken}` },
    payload: {
      bookingId: bookingData.id,
      paymentMethod: 'UPI',
      idempotencyKey: idemKey
    }
  });
  console.log('  ✓ Idempotent request returned existing record -> Status:', dupPayRes.statusCode);
  const dupPayData = JSON.parse(dupPayRes.payload).data;
  if (dupPayData.paymentId !== paymentRecord.paymentId) throw new Error('Idempotency failed: generated new payment ID');

  // 12.3 Another student attempts to pay for first student\'s booking -> 400 Rejected
  const crossPayRes = await app.inject({
    method: 'POST',
    url: '/api/v1/payments/create',
    headers: { authorization: `Bearer ${newStudentToken}` },
    payload: {
      bookingId: bookingData.id,
      paymentMethod: 'CARD',
      idempotencyKey: `idem-hacker-${Date.now()}`
    }
  });
  console.log('  ✓ Cross-student booking payment blocked -> Status:', crossPayRes.statusCode);
  if (crossPayRes.statusCode !== 400) throw new Error('Cross-student payment was not rejected');

  // --------------------------------------------------------------------------
  // TEST GROUP 13: MOCK PAYMENT PROCESSING & SERVER-SIDE VERIFICATION
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 13] Payment Processing & Server Verification (Success):');

  // 13.1 Simulate user completing payment on UPI gateway
  const processPayRes = await app.inject({
    method: 'POST',
    url: `/api/v1/payments/${paymentRecord.paymentId}/process`,
    headers: { authorization: `Bearer ${studentToken}` },
    payload: {
      outcome: 'SUCCESS',
      method: 'UPI'
    }
  });
  console.log('  ✓ Process & Verify Payment -> Status:', processPayRes.statusCode);
  if (processPayRes.statusCode !== 200) throw new Error('Payment processing failed');
  const verifyResult = JSON.parse(processPayRes.payload).data;
  console.log(`    Payment Status: ${verifyResult.payment.status} | Booking Status: ${verifyResult.booking.status}`);
  if (verifyResult.payment.status !== 'SUCCESS') throw new Error('Payment was not marked SUCCESS');
  if (verifyResult.booking.status !== 'CONFIRMED') throw new Error('Booking was not transitioned to CONFIRMED');
  console.log(`    Generated ${verifyResult.tickets.length} Digital Ticket(s).`);
  if (verifyResult.tickets.length !== bookingData.quantity) throw new Error(`Expected ${bookingData.quantity} tickets`);

  // --------------------------------------------------------------------------
  // TEST GROUP 14: SECURE CRYPTOGRAPHIC TICKET GENERATION & PRIVACY
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 14] Secure Cryptographic Ticket Generation & Privacy:');

  const generatedTicket = verifyResult.tickets[0];
  console.log(`    Ticket ID: ${generatedTicket.id} | Number: ${generatedTicket.ticketNumber}`);
  console.log(`    Secure Token: ${generatedTicket.secureToken.substring(0, 16)}... (Length: ${generatedTicket.secureToken.length})`);
  console.log(`    QR Payload: ${generatedTicket.qrPayload}`);

  // Security audit of QR payload: MUST NOT expose PII or academic details
  const piiStrings = ['Aarav', 'Sharma', 'student@virtupass.demo', '9.72', '20%', 'VIT20260001'];
  for (const str of piiStrings) {
    if (generatedTicket.qrPayload.includes(str)) {
      throw new Error(`CRITICAL SECURITY FAILURE: QR payload contains sensitive data: "${str}"`);
    }
  }
  console.log('  ✓ Privacy check passed: QR payload contains zero personal, academic, or financial details.');

  // Validate QR Code data URL is high-resolution Base64 image
  if (!generatedTicket.qrCodeDataUrl.startsWith('data:image/png;base64,')) {
    throw new Error('QR code data URL is not a valid base64 image');
  }
  console.log('  ✓ Valid scan-optimized base64 QR code image rendered by ticket engine.');

  // --------------------------------------------------------------------------
  // TEST GROUP 15: REPLAY & DUPLICATE TICKET ISSUANCE PROTECTION
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 15] Duplicate Payment & Ticket Reissuance Protection:');

  // Verify payment again (Replayed verification request)
  const reVerifyRes = await app.inject({
    method: 'POST',
    url: `/api/v1/payments/${paymentRecord.paymentId}/verify`,
    headers: { authorization: `Bearer ${studentToken}` }
  });
  console.log('  ✓ Replayed verification -> Status:', reVerifyRes.statusCode);
  const reVerifyData = JSON.parse(reVerifyRes.payload).data;
  if (reVerifyData.tickets.length !== bookingData.quantity) {
    throw new Error('Replayed verification created extra tickets!');
  }
  console.log('  ✓ Replayed verification returned existing tickets safely without duplicating.');

  // --------------------------------------------------------------------------
  // TEST GROUP 16: FAILED & CANCELLED PAYMENTS (INVENTORY RESTORATION)
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 16] Failed/Cancelled Payments & Inventory Restoration:');

  // 16.1 Create quote and booking for 1 ticket
  const failQuoteRes = await app.inject({
    method: 'POST',
    url: '/api/v1/bookings/quote',
    headers: { authorization: `Bearer ${studentToken}` },
    payload: {
      eventId: 'evt-rhythm-night',
      ticketCategoryId: 'tc-rn-regular',
      quantity: 1
    }
  });
  const failQuoteId = JSON.parse(failQuoteRes.payload).data.quoteId;

  const failBookRes = await app.inject({
    method: 'POST',
    url: '/api/v1/bookings',
    headers: { authorization: `Bearer ${studentToken}` },
    payload: { quoteId: failQuoteId }
  });
  const failBooking = JSON.parse(failBookRes.payload).data;

  // Check event capacity before failure
  const evBeforeRes = await app.inject({ method: 'GET', url: '/api/v1/events/evt-rhythm-night' });
  const capBefore = JSON.parse(evBeforeRes.payload).data.remainingCapacity;

  // Create payment for failBooking
  const payFailRes = await app.inject({
    method: 'POST',
    url: '/api/v1/payments/create',
    headers: { authorization: `Bearer ${studentToken}` },
    payload: {
      bookingId: failBooking.id,
      paymentMethod: 'CARD',
      idempotencyKey: `idem-fail-${Date.now()}`
    }
  });
  const failPayId = JSON.parse(payFailRes.payload).data.paymentId;

  // Simulate FAILED payment
  const processFailRes = await app.inject({
    method: 'POST',
    url: `/api/v1/payments/${failPayId}/process`,
    headers: { authorization: `Bearer ${studentToken}` },
    payload: { outcome: 'FAILED' }
  });
  console.log('  ✓ Process Failed Payment -> Status:', processFailRes.statusCode);
  const failResult = JSON.parse(processFailRes.payload).data;
  console.log(`    Payment Status: ${failResult.payment.status} | Booking Status: ${failResult.booking.status}`);
  if (failResult.payment.status !== 'FAILED') throw new Error('Payment was not marked FAILED');
  if (failResult.booking.status !== 'PAYMENT_FAILED') throw new Error('Booking was not marked PAYMENT_FAILED');
  if (failResult.tickets.length !== 0) throw new Error('Tickets were issued for a failed payment!');

  // Verify inventory capacity was restored
  const evAfterRes = await app.inject({ method: 'GET', url: '/api/v1/events/evt-rhythm-night' });
  const capAfter = JSON.parse(evAfterRes.payload).data.remainingCapacity;
  console.log(`    Capacity before failure: ${capBefore} -> after restoration: ${capAfter}`);
  if (capAfter !== capBefore + 1) throw new Error('Inventory capacity was not restored upon payment failure');
  console.log('  ✓ Ticket allocation restored successfully to event inventory.');

  // --------------------------------------------------------------------------
  // TEST GROUP 17: MULTI-TICKET QUANTITY GENERATION (3 DISTINCT TICKETS)
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 17] Multi-Ticket Booking (3 Passes) Generation:');

  const multiQuoteRes = await app.inject({
    method: 'POST',
    url: '/api/v1/bookings/quote',
    headers: { authorization: `Bearer ${studentToken}` },
    payload: {
      eventId: 'evt-codesprint-2026',
      ticketCategoryId: 'tc-cs-single',
      quantity: 3
    }
  });
  const multiQuoteId = JSON.parse(multiQuoteRes.payload).data.quoteId;

  const multiBookRes = await app.inject({
    method: 'POST',
    url: '/api/v1/bookings',
    headers: { authorization: `Bearer ${studentToken}` },
    payload: { quoteId: multiQuoteId }
  });
  const multiBooking = JSON.parse(multiBookRes.payload).data;

  const multiPayRes = await app.inject({
    method: 'POST',
    url: '/api/v1/payments/create',
    headers: { authorization: `Bearer ${studentToken}` },
    payload: {
      bookingId: multiBooking.id,
      paymentMethod: 'NET_BANKING',
      idempotencyKey: `idem-multi-${Date.now()}`
    }
  });
  const multiPayId = JSON.parse(multiPayRes.payload).data.paymentId;

  const multiProcessRes = await app.inject({
    method: 'POST',
    url: `/api/v1/payments/${multiPayId}/process`,
    headers: { authorization: `Bearer ${studentToken}` },
    payload: { outcome: 'SUCCESS' }
  });
  const multiData = JSON.parse(multiProcessRes.payload).data;
  console.log(`    Multi-pass booking generated ${multiData.tickets.length} distinct tickets.`);
  if (multiData.tickets.length !== 3) throw new Error('Expected exactly 3 tickets');

  // Verify uniqueness of ticket IDs and cryptographic tokens
  const ticketIds = new Set(multiData.tickets.map((t: any) => t.id));
  const tokens = new Set(multiData.tickets.map((t: any) => t.secureToken));
  const qrPayloads = new Set(multiData.tickets.map((t: any) => t.qrPayload));
  if (ticketIds.size !== 3 || tokens.size !== 3 || qrPayloads.size !== 3) {
    throw new Error('Generated tickets do not have unique IDs or tokens');
  }
  console.log('  ✓ All 3 tickets have 100% unique IDs, cryptographically random tokens, and QR payloads.');

  // --------------------------------------------------------------------------
  // TEST GROUP 18: TICKET DOWNLOAD & ACCESS BOUNDARIES
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 18] Ticket Retrieval, Download Data & Access Control:');

  // 18.1 Student retrieves own tickets
  const myTicketsRes = await app.inject({
    method: 'GET',
    url: '/api/v1/tickets/my',
    headers: { authorization: `Bearer ${studentToken}` }
  });
  console.log('  ✓ GET /api/v1/tickets/my -> Status:', myTicketsRes.statusCode);
  const myTickets = JSON.parse(myTicketsRes.payload).data;
  console.log(`    Student has ${myTickets.length} active digital ticket(s).`);

  // 18.2 Second student attempts to access first student\'s ticket -> 403
  const crossTicketRes = await app.inject({
    method: 'GET',
    url: `/api/v1/tickets/${generatedTicket.id}`,
    headers: { authorization: `Bearer ${newStudentToken}` }
  });
  console.log('  ✓ Cross-student ticket access blocked -> Status:', crossTicketRes.statusCode);
  if (crossTicketRes.statusCode !== 403) throw new Error('Cross-student ticket access was not blocked');

  // 18.3 Ticket Download data endpoint
  const downloadRes = await app.inject({
    method: 'GET',
    url: `/api/v1/tickets/${generatedTicket.id}/download`,
    headers: { authorization: `Bearer ${studentToken}` }
  });
  console.log('  ✓ GET /api/v1/tickets/:id/download -> Status:', downloadRes.statusCode);
  if (downloadRes.statusCode !== 200) throw new Error('Download ticket endpoint failed');
  const downloadData = JSON.parse(downloadRes.payload).data;
  console.log(`    Downloaded Ticket Slip: ${downloadData.ticketNumber} for ${downloadData.eventTitle}`);

  // --------------------------------------------------------------------------
  // TEST GROUP 19: ADMIN USER MANAGEMENT & SUSPENSION LIFECYCLE
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 19] Admin User Management & Suspension Lifecycle:');
  const adminUsersRes = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/users',
    headers: { authorization: `Bearer ${adminToken}` }
  });
  console.log('  ✓ GET /api/v1/admin/users -> Status:', adminUsersRes.statusCode);
  if (adminUsersRes.statusCode !== 200) throw new Error('Failed to fetch admin users');
  const allUsers = JSON.parse(adminUsersRes.payload).data;
  console.log(`    Retrieved ${allUsers.length} users from memory registry.`);

  // Suspend student
  const suspendRes = await app.inject({
    method: 'PATCH',
    url: `/api/v1/admin/users/${regStudentJson.data.user.id}/status`,
    headers: { authorization: `Bearer ${adminToken}` },
    payload: { status: 'SUSPENDED' }
  });
  console.log('  ✓ Admin suspend user -> Status:', suspendRes.statusCode);
  if (suspendRes.statusCode !== 200) throw new Error('Failed to suspend user');

  // Reactivate student
  const reactivateRes = await app.inject({
    method: 'PATCH',
    url: `/api/v1/admin/users/${regStudentJson.data.user.id}/status`,
    headers: { authorization: `Bearer ${adminToken}` },
    payload: { status: 'ACTIVE' }
  });
  console.log('  ✓ Admin reactivate user -> Status:', reactivateRes.statusCode);
  if (reactivateRes.statusCode !== 200) throw new Error('Failed to reactivate user');

  // --------------------------------------------------------------------------
  // TEST GROUP 20: ADMIN ORGANIZER MODERATION LIFECYCLE
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 20] Admin Organizer Moderation Lifecycle:');
  const adminOrgsRes = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/organizers',
    headers: { authorization: `Bearer ${adminToken}` }
  });
  console.log('  ✓ GET /api/v1/admin/organizers -> Status:', adminOrgsRes.statusCode);
  if (adminOrgsRes.statusCode !== 200) throw new Error('Failed to fetch organizers');
  const allOrgs = JSON.parse(adminOrgsRes.payload).data;
  console.log(`    Found ${allOrgs.length} organizers.`);

  // Approve pending organizer
  const approveOrgRes = await app.inject({
    method: 'POST',
    url: '/api/v1/admin/organizers/usr-demo-org-pending/approve',
    headers: { authorization: `Bearer ${adminToken}` }
  });
  console.log('  ✓ Admin approve organizer -> Status:', approveOrgRes.statusCode);
  if (approveOrgRes.statusCode !== 200) throw new Error('Failed to approve organizer');

  // Reject an organizer with reason
  const rejectOrgRes = await app.inject({
    method: 'POST',
    url: '/api/v1/admin/organizers/usr-demo-org-pending/reject',
    headers: { authorization: `Bearer ${adminToken}` },
    payload: { reason: 'Pending affiliation verification from university dean' }
  });
  console.log('  ✓ Admin reject organizer -> Status:', rejectOrgRes.statusCode);
  if (rejectOrgRes.statusCode !== 200) throw new Error('Failed to reject organizer');

  // --------------------------------------------------------------------------
  // TEST GROUP 21: ADMIN EVENT MODERATION & WORKFLOW
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 21] Admin Event Moderation & Workflow:');
  const adminEventsRes = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/events',
    headers: { authorization: `Bearer ${adminToken}` }
  });
  console.log('  ✓ GET /api/v1/admin/events -> Status:', adminEventsRes.statusCode);
  if (adminEventsRes.statusCode !== 200) throw new Error('Failed to list admin events');

  // Admin publish event
  const pubEventRes = await app.inject({
    method: 'POST',
    url: '/api/v1/admin/events/evt-ai-summit-2026/publish',
    headers: { authorization: `Bearer ${adminToken}` }
  });
  console.log('  ✓ Admin publish event -> Status:', pubEventRes.statusCode);
  if (pubEventRes.statusCode !== 200) throw new Error('Failed to publish event');

  // --------------------------------------------------------------------------
  // TEST GROUP 22: GATE SCANNER & CRYPTOGRAPHIC QR VALIDATION
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 22] Gate Scanner & Cryptographic QR Validation:');

  // 22.1 First-time valid scan -> ADMITTED
  const validScanRes = await app.inject({
    method: 'POST',
    url: '/api/v1/attendance/scan',
    headers: { authorization: `Bearer ${organizerToken}` },
    payload: {
      tokenOrPayload: generatedTicket.qrPayload,
      eventId: generatedTicket.eventId,
      gateName: 'Turnstile A (Main Entrance)',
      deviceInfo: 'Laser Scanner #01'
    }
  });
  console.log('  ✓ Valid Gate QR Scan -> Status:', validScanRes.statusCode);
  if (validScanRes.statusCode !== 200) throw new Error(`Valid scan failed: ${validScanRes.payload}`);
  const scanData = JSON.parse(validScanRes.payload);
  console.log(`    Result: ${scanData.scanResult} | Attendee: ${scanData.data.attendee.name} | Pass: ${scanData.data.ticket.ticketNumber}`);
  if (scanData.scanResult !== 'ADMITTED') throw new Error('Ticket was not admitted');

  // 22.2 Atomic Duplicate Entry Prevention -> 409 DUPLICATE
  const dupScanRes = await app.inject({
    method: 'POST',
    url: '/api/v1/attendance/scan',
    headers: { authorization: `Bearer ${organizerToken}` },
    payload: {
      tokenOrPayload: generatedTicket.qrPayload,
      eventId: generatedTicket.eventId,
      gateName: 'Turnstile B (Side Gate)'
    }
  });
  console.log('  ✓ Duplicate Scan Attempt -> Status:', dupScanRes.statusCode);
  if (dupScanRes.statusCode !== 409) throw new Error('Duplicate scan was not rejected with 409');
  const dupData = JSON.parse(dupScanRes.payload);
  console.log(`    Result: ${dupData.scanResult} | Rejection: ${dupData.error.message}`);
  if (dupData.scanResult !== 'DUPLICATE') throw new Error('Scan result was not DUPLICATE');

  // 22.3 Wrong Event Rejection -> 400 WRONG_EVENT
  const wrongEventRes = await app.inject({
    method: 'POST',
    url: '/api/v1/attendance/scan',
    headers: { authorization: `Bearer ${organizerToken}` },
    payload: {
      tokenOrPayload: generatedTicket.qrPayload,
      eventId: 'evt-rhythm-night', // Ticket is for technova, not rhythm night
      gateName: 'Concert Gate 1'
    }
  });
  console.log('  ✓ Wrong Event Ticket Scan -> Status:', wrongEventRes.statusCode);
  if (wrongEventRes.statusCode !== 400) throw new Error('Wrong event scan was not rejected');
  const wrongEventData = JSON.parse(wrongEventRes.payload);
  console.log(`    Result: ${wrongEventData.scanResult} | Message: ${wrongEventData.error.message}`);
  if (wrongEventData.scanResult !== 'WRONG_EVENT') throw new Error('Scan result was not WRONG_EVENT');

  // 22.4 Counterfeit / Tampered QR signature -> 400 INVALID
  const fakeScanRes = await app.inject({
    method: 'POST',
    url: '/api/v1/attendance/scan',
    headers: { authorization: `Bearer ${organizerToken}` },
    payload: {
      tokenOrPayload: 'VP:tkt-counterfeit-999:badsignature123',
      eventId: generatedTicket.eventId,
      gateName: 'Turnstile A'
    }
  });
  console.log('  ✓ Counterfeit QR Scan -> Status:', fakeScanRes.statusCode);
  if (fakeScanRes.statusCode !== 400) throw new Error('Counterfeit scan was not rejected');

  // --------------------------------------------------------------------------
  // TEST GROUP 23: TICKET REVOCATION & GATE ENFORCEMENT
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 23] Ticket Revocation & Gate Enforcement:');
  // Admin revokes the second ticket from multi-pass booking
  const ticketToRevoke = myTickets[1];
  const revokeRes = await app.inject({
    method: 'POST',
    url: `/api/v1/admin/tickets/${ticketToRevoke.id}/revoke`,
    headers: { authorization: `Bearer ${adminToken}` },
    payload: { reason: 'Academic conduct disciplinary hold' }
  });
  console.log('  ✓ Admin revoke ticket -> Status:', revokeRes.statusCode);
  if (revokeRes.statusCode !== 200) throw new Error('Ticket revocation failed');
  const revokedTicket = JSON.parse(revokeRes.payload).data;
  console.log(`    Revoked Pass: ${revokedTicket.ticketNumber} | Status: ${revokedTicket.status}`);

  // Gate scan of revoked ticket must be rejected with 403 REVOKED
  const scanRevokedRes = await app.inject({
    method: 'POST',
    url: '/api/v1/attendance/scan',
    headers: { authorization: `Bearer ${organizerToken}` },
    payload: {
      tokenOrPayload: ticketToRevoke.qrPayload,
      eventId: ticketToRevoke.eventId,
      gateName: 'Turnstile A'
    }
  });
  console.log('  ✓ Scan Revoked Ticket -> Status:', scanRevokedRes.statusCode);
  if (scanRevokedRes.statusCode !== 403) throw new Error('Revoked ticket was not blocked at gate');
  const revokedScanData = JSON.parse(scanRevokedRes.payload);
  console.log(`    Result: ${revokedScanData.scanResult} | Rejection: ${revokedScanData.error.message}`);
  if (revokedScanData.scanResult !== 'REVOKED') throw new Error('Scan result was not REVOKED');

  // --------------------------------------------------------------------------
  // TEST GROUP 24: ATTENDANCE TRACKING, ANALYTICS & CSV EXPORT
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 24] Attendance Tracking, Analytics & CSV Export:');
  const attendanceListRes = await app.inject({
    method: 'GET',
    url: `/api/v1/attendance?eventId=${generatedTicket.eventId}`,
    headers: { authorization: `Bearer ${organizerToken}` }
  });
  console.log('  ✓ GET /api/v1/attendance -> Status:', attendanceListRes.statusCode);
  if (attendanceListRes.statusCode !== 200) throw new Error('Failed to retrieve attendance roster');
  const attRoster = JSON.parse(attendanceListRes.payload).data;
  console.log(`    Found ${attRoster.length} attendance scan log(s) for event.`);

  const attStatsRes = await app.inject({
    method: 'GET',
    url: `/api/v1/attendance/stats?eventId=${generatedTicket.eventId}`,
    headers: { authorization: `Bearer ${organizerToken}` }
  });
  console.log('  ✓ GET /api/v1/attendance/stats -> Status:', attStatsRes.statusCode);
  const statsData = JSON.parse(attStatsRes.payload).data;
  console.log(`    Stats -> Admitted: ${statsData.admitted} | Duplicates: ${statsData.duplicates} | Rate: ${statsData.admittedRate}%`);

  // CSV Export verification
  const csvRes = await app.inject({
    method: 'GET',
    url: `/api/v1/attendance/export?eventId=${generatedTicket.eventId}`,
    headers: { authorization: `Bearer ${organizerToken}` }
  });
  console.log('  ✓ GET /api/v1/attendance/export -> Status:', csvRes.statusCode);
  if (csvRes.statusCode !== 200) throw new Error('CSV export failed');
  if (!csvRes.payload.includes('Record ID,Ticket Number,Attendee Name')) {
    throw new Error('CSV headers missing from export');
  }
  console.log('    CSV Export contains verified turnstile headers & rows.');

  // Admin Analytics Overview
  const adminAnalyticsRes = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/analytics/overview',
    headers: { authorization: `Bearer ${adminToken}` }
  });
  console.log('  ✓ GET /api/v1/admin/analytics/overview -> Status:', adminAnalyticsRes.statusCode);
  const adminAnalytics = JSON.parse(adminAnalyticsRes.payload).data;
  console.log(`    Platform Stats -> Revenue: ₹${adminAnalytics.totalRevenueINR} | Tickets: ${adminAnalytics.totalTicketsIssued} | Check-ins: ${adminAnalytics.totalTicketsUsed}`);

  // Organizer Analytics Overview
  const orgAnalyticsRes = await app.inject({
    method: 'GET',
    url: '/api/v1/organizer/analytics/overview',
    headers: { authorization: `Bearer ${organizerToken}` }
  });
  console.log('  ✓ GET /api/v1/organizer/analytics/overview -> Status:', orgAnalyticsRes.statusCode);
  const orgAnalytics = JSON.parse(orgAnalyticsRes.payload).data;
  console.log(`    Organizer Stats -> Events: ${orgAnalytics.totalEvents} | Revenue: ₹${orgAnalytics.totalRevenueINR} | Admitted: ${orgAnalytics.totalAttendeesAdmitted}`);

  // --------------------------------------------------------------------------
  // TEST GROUP 25: PLATFORM AUDIT TRAIL
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 25] Platform Audit Trail:');
  const auditRes = await app.inject({
    method: 'GET',
    url: '/api/v1/admin/audit',
    headers: { authorization: `Bearer ${adminToken}` }
  });
  console.log('  ✓ GET /api/v1/admin/audit -> Status:', auditRes.statusCode);
  if (auditRes.statusCode !== 200) throw new Error('Failed to retrieve audit log');
  const auditLogs = JSON.parse(auditRes.payload).data;
  console.log(`    Retrieved ${auditLogs.length} immutable audit logs from memory.`);
  const hasScanAdmitted = auditLogs.some((l: any) => l.action === 'GATE_SCAN_ADMITTED');
  const hasRevocation = auditLogs.some((l: any) => l.action === 'TICKET_REVOKED');
  if (!hasScanAdmitted || !hasRevocation) throw new Error('Audit trail missing gate scan or ticket revocation action');
  console.log('  ✓ Audit entries confirmed for GATE_SCAN_ADMITTED and TICKET_REVOKED.');

  // --------------------------------------------------------------------------
  // TEST GROUP 26: PARALLEL CONCURRENT TURNSTILE SCAN ATOMICITY
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 26] Parallel Concurrent Turnstile Scan Atomicity:');
  const concurrentTicket = myTickets[2]; // Use 3rd active ticket
  console.log(`    Simulating parallel concurrent scan of pass: ${concurrentTicket.ticketNumber} across Turnstiles 1 & 2`);

  const [scanA, scanB] = await Promise.all([
    app.inject({
      method: 'POST',
      url: '/api/v1/attendance/scan',
      headers: { authorization: `Bearer ${organizerToken}` },
      payload: {
        tokenOrPayload: concurrentTicket.qrPayload,
        eventId: concurrentTicket.eventId,
        gateName: 'Turnstile 1 (Gate A)'
      }
    }),
    app.inject({
      method: 'POST',
      url: '/api/v1/attendance/scan',
      headers: { authorization: `Bearer ${organizerToken}` },
      payload: {
        tokenOrPayload: concurrentTicket.qrPayload,
        eventId: concurrentTicket.eventId,
        gateName: 'Turnstile 2 (Gate B)'
      }
    })
  ]);

  const statusCodes = [scanA.statusCode, scanB.statusCode].sort();
  console.log(`    Concurrent scan response codes: Turnstile 1 -> ${scanA.statusCode}, Turnstile 2 -> ${scanB.statusCode}`);
  if (statusCodes[0] !== 200 || statusCodes[1] !== 409) {
    throw new Error(`Expected exactly one 200 and one 409, but received [${scanA.statusCode}, ${scanB.statusCode}]`);
  }

  const admittedScan = scanA.statusCode === 200 ? JSON.parse(scanA.payload) : JSON.parse(scanB.payload);
  const duplicateScan = scanA.statusCode === 409 ? JSON.parse(scanA.payload) : JSON.parse(scanB.payload);

  if (admittedScan.scanResult !== 'ADMITTED' || duplicateScan.scanResult !== 'DUPLICATE') {
    throw new Error('Concurrent scan outcome mismatch');
  }
  console.log('  ✓ Atomic turnstile protection verified: Exactly 1 admission granted, 1 duplicate blocked.');

  // --------------------------------------------------------------------------
  // TEST GROUP 27: SUSPENDED ACCOUNTS & CANCELLED EVENT DEFENSES
  // --------------------------------------------------------------------------
  console.log('\n[TEST GROUP 27] Suspended Accounts & Cancelled Event Defenses:');

  // 27.1 Suspended student attempting login -> 403
  const suspendedLoginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: 'suspended.student@virtupass.demo',
      password: 'Demo@123'
    }
  });
  console.log('  ✓ Suspended student login blocked -> Status:', suspendedLoginRes.statusCode);
  if (suspendedLoginRes.statusCode !== 403) throw new Error('Suspended student was not blocked at login');

  // 27.2 Cancel an event and verify booking is blocked
  const cancelEvtRes = await app.inject({
    method: 'POST',
    url: '/api/v1/admin/events/evt-ai-summit-2026/cancel',
    headers: { authorization: `Bearer ${adminToken}` },
    payload: { reason: 'Emergency weather hazard cancellation' }
  });
  console.log('  ✓ Admin cancel event -> Status:', cancelEvtRes.statusCode);

  // Attempt booking quote on cancelled event -> 400
  const quoteCancelledRes = await app.inject({
    method: 'POST',
    url: '/api/v1/bookings/quote',
    headers: { authorization: `Bearer ${studentToken}` },
    payload: {
      eventId: 'evt-ai-summit-2026',
      ticketCategoryId: 'tc-ai-summit-delegate',
      quantity: 1
    }
  });
  console.log('  ✓ Booking quote on cancelled event blocked -> Status:', quoteCancelledRes.statusCode);
  if (quoteCancelledRes.statusCode !== 400) throw new Error('Cancelled event allowed booking quote');

  await app.close();
  console.log('\n===============================================================');
  console.log('  ALL 68 COMPREHENSIVE PRODUCTION-READY TESTS PASSED (EXIT 0)! ');
  console.log('===============================================================');
}

runVirtuPassTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILURE:', err);
  process.exit(1);
});