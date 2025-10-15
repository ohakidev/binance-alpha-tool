/**
 * Test script for Real Alpha123 Sync API
 *
 * Usage: node test-sync.js
 */

async function testSync() {
  console.log('🧪 Testing Alpha123.uk Real Data Sync API...\n');

  try {
    // Test sync endpoint
    console.log('📡 Calling /api/binance/alpha/sync...');
    const response = await fetch('http://localhost:3000/api/binance/alpha/sync?force=true');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    console.log('\n✅ Sync API Response:');
    console.log('─'.repeat(50));
    console.log(`Success: ${result.success}`);
    console.log(`Source: ${result.data?.source || 'N/A'}`);
    console.log(`Last Update: ${result.data?.lastUpdate || 'N/A'}`);
    console.log(`Total Projects: ${result.data?.total || 0}`);
    console.log(`Created: ${result.data?.created || 0}`);
    console.log(`Updated: ${result.data?.updated || 0}`);
    console.log(`Failed: ${result.data?.failed || 0}`);

    if (result.data?.errors && result.data.errors.length > 0) {
      console.log('\n⚠️ Errors:');
      result.data.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    // Test airdrops endpoint
    console.log('\n\n📡 Calling /api/binance/alpha/airdrops...');
    const airdropsResponse = await fetch('http://localhost:3000/api/binance/alpha/airdrops?status=claimable&limit=5');

    if (!airdropsResponse.ok) {
      throw new Error(`HTTP error! status: ${airdropsResponse.status}`);
    }

    const airdropsResult = await airdropsResponse.json();

    console.log('\n✅ Airdrops API Response:');
    console.log('─'.repeat(50));
    console.log(`Success: ${airdropsResult.success}`);
    console.log(`Count: ${airdropsResult.count || 0}`);
    console.log(`Source: ${airdropsResult.source || 'N/A'}`);

    if (airdropsResult.data && airdropsResult.data.length > 0) {
      console.log('\n📋 Sample Projects:');
      airdropsResult.data.slice(0, 3).forEach((airdrop, i) => {
        console.log(`\n${i + 1}. ${airdrop.projectName} ($${airdrop.symbol})`);
        console.log(`   Chain: ${airdrop.chain}`);
        console.log(`   Type: ${airdrop.type}`);
        console.log(`   Required Points: ${airdrop.requiredPoints || 0}`);
        console.log(`   Deduct Points: ${airdrop.deductPoints || 0}`);
        console.log(`   Amount: ${airdrop.airdropAmount}`);
        console.log(`   Contract: ${airdrop.contractAddress || 'N/A'}`);
      });
    } else {
      console.log('\n⚠️ No airdrops found in database');
    }

    console.log('\n\n' + '═'.repeat(50));
    console.log('✨ Test completed successfully!');
    console.log('═'.repeat(50));

  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error.message);

    if (error.cause) {
      console.error('\nCause:', error.cause);
    }

    process.exit(1);
  }
}

// Run test
testSync();
