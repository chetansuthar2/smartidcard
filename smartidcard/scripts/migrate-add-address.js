const { MongoClient } = require('mongodb');

// MongoDB connection string - update this with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

async function migrateAddressField() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('idcard');
    const studentsCollection = db.collection('students');
    
    // Check how many students don't have address field
    const studentsWithoutAddress = await studentsCollection.countDocuments({
      address: { $exists: false }
    });
    
    console.log(`Found ${studentsWithoutAddress} students without address field`);
    
    if (studentsWithoutAddress > 0) {
      // Add address field to all students who don't have it
      const result = await studentsCollection.updateMany(
        { address: { $exists: false } },
        { 
          $set: { 
            address: null,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log(`Updated ${result.modifiedCount} students with address field`);
    } else {
      console.log('All students already have address field');
    }
    
    // Verify the migration
    const totalStudents = await studentsCollection.countDocuments({});
    const studentsWithAddress = await studentsCollection.countDocuments({
      address: { $exists: true }
    });
    
    console.log(`Total students: ${totalStudents}`);
    console.log(`Students with address field: ${studentsWithAddress}`);
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

// Run the migration
migrateAddressField();
