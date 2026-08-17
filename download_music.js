const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

const states = [
  { id: '1', slug: 'andaman-and-nicobar-islands', name: 'Andaman and Nicobar Islands' },
  { id: '2', slug: 'andhra-pradesh', name: 'Andhra Pradesh' },
  { id: '3', slug: 'arunachal-pradesh', name: 'Arunachal Pradesh' },
  { id: '4', slug: 'assam', name: 'Assam' },
  { id: '5', slug: 'bihar', name: 'Bihar' },
  { id: '6', slug: 'chandigarh', name: 'Chandigarh' },
  { id: '7', slug: 'chhattisgarh', name: 'Chhattisgarh' },
  { id: '8', slug: 'dadra-and-nagar-haveli', name: 'Dadra and Nagar Haveli' },
  { id: '9', slug: 'daman-and-diu', name: 'Daman and Diu' },
  { id: '10', slug: 'delhi', name: 'Delhi' },
  { id: '11', slug: 'goa', name: 'Goa' },
  { id: '12', slug: 'gujarat', name: 'Gujarat' },
  { id: '13', slug: 'haryana', name: 'Haryana' },
  { id: '14', slug: 'himachal-pradesh', name: 'Himachal Pradesh' },
  { id: '15', slug: 'jammu-and-kashmir', name: 'Jammu and Kashmir' },
  { id: '16', slug: 'jharkhand', name: 'Jharkhand' },
  { id: '17', slug: 'karnataka', name: 'Karnataka' },
  { id: '18', slug: 'kerala', name: 'Kerala' },
  { id: '19', slug: 'lakshadweep', name: 'Lakshadweep' },
  { id: '20', slug: 'madhya-pradesh', name: 'Madhya Pradesh' },
  { id: '21', slug: 'maharashtra', name: 'Maharashtra' },
  { id: '22', slug: 'manipur', name: 'Manipur' },
  { id: '23', slug: 'meghalaya', name: 'Meghalaya' },
  { id: '24', slug: 'mizoram', name: 'Mizoram' },
  { id: '25', slug: 'nagaland', name: 'Nagaland' },
  { id: '26', slug: 'odisha', name: 'Odisha' },
  { id: '27', slug: 'puducherry', name: 'Puducherry' },
  { id: '28', slug: 'punjab', name: 'Punjab' },
  { id: '29', slug: 'rajasthan', name: 'Rajasthan' },
  { id: '30', slug: 'sikkim', name: 'Sikkim' },
  { id: '31', slug: 'tamil-nadu', name: 'Tamil Nadu' },
  { id: '32', slug: 'telangana', name: 'Telangana' },
  { id: '33', slug: 'tripura', name: 'Tripura' },
  { id: '34', slug: 'uttar-pradesh', name: 'Uttar Pradesh' },
  { id: '35', slug: 'uttarakhand', name: 'Uttarakhand' },
  { id: '36', slug: 'west-bengal', name: 'West Bengal' }
];

const queriesPath = path.join(__dirname, 'lib', 'queries.ts');

async function downloadForState(state) {
  const destPath = path.join(__dirname, 'public', `${state.slug}.mp3`);
  if (fs.existsSync(destPath)) {
    console.log(`Already have ${state.slug}.mp3`);
    return state;
  }

  const query = `${state.name} folk music`;
  console.log(`Downloading for ${state.name}...`);
  try {
    await execPromise(`yt-dlp "scsearch1:${query}" -x --audio-format mp3 -o "public/${state.slug}.%(ext)s"`, { timeout: 120000 });
    console.log(`Successfully downloaded ${state.slug}.mp3`);
    return state;
  } catch (err) {
    console.error(`Failed to download for ${state.name}:`, err.message);
    return null;
  }
}

async function run() {
  console.log(`Starting downloads for ${states.length} states...`);
  const concurrency = 4;
  let active = [];
  
  for (let i = 0; i < states.length; i++) {
    if (states[i].id === '5') continue; // Skip Bihar

    const p = downloadForState(states[i]).then(res => {
      active.splice(active.indexOf(p), 1);
      if (res) {
        let queriesContent = fs.readFileSync(queriesPath, 'utf8');
        // Match the exact ID and replace any /dummy.mp3 occurrences in that block
        // Because a state might have multiple tracks, we use a regex that matches the state's tracks block
        const stateBlockRegex = new RegExp(`('${res.id}': \\[[\\s\\S]*?\\])`, 'g');
        queriesContent = queriesContent.replace(stateBlockRegex, (match) => {
            return match.replace(/\/dummy\.mp3/g, `/${res.slug}.mp3`);
        });
        fs.writeFileSync(queriesPath, queriesContent);
      }
    });
    active.push(p);
    
    if (active.length >= concurrency) {
      await Promise.race(active);
    }
  }
  
  await Promise.all(active);
  console.log('All downloads completed!');
}

run();
