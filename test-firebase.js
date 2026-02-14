import { initializeFirebase, saveInvoice, getFirestore } from './src/firebaseClient.js';

console.log('🧪 Testing Firebase Connection...\n');

async function testFirebase() {
  try {
    // Initialize
    console.log('1️⃣ Initializing Firebase...');
    initializeFirebase();
    console.log('   ✅ Firebase initialized\n');

    // Test Firestore write
    console.log('2️⃣ Testing Firestore write...');
    const testInvoice = {
      invoice_number: 'TEST-001',
      customer_name: 'Test Customer',
      date: new Date().toISOString(),
      items: [{ name: 'Test Item', quantity: 1, rate: 100, amount: 100 }],
      grand_total: 100,
      test: true
    };

    await saveInvoice('test-invoice-001', testInvoice);
    console.log('   ✅ Firestore write successful\n');

    // Test Firestore read
    console.log('3️⃣ Testing Firestore read...');
    const db = getFirestore();
    const doc = await db.collection('invoices').doc('test-invoice-001').get();

    if (doc.exists) {
      console.log('   ✅ Firestore read successful');
      console.log('   📄 Data:', doc.data().invoice_number);
    } else {
      console.log('   ❌ Could not read back test invoice');
    }

    console.log('\n🎉 All Firebase tests passed!');
    console.log('✅ Firebase is ready to use with SnapBooks\n');

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await db.collection('invoices').doc('test-invoice-001').delete();
    console.log('   ✅ Test data deleted\n');

  } catch (error) {
    console.error('\n❌ Firebase test failed:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

testFirebase();
