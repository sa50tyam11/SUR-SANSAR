import { supabase, type State, type Track } from './supabase'

const dummyStates: State[] = [
  {
    "id": "1",
    "name_en": "Andaman and Nicobar Islands",
    "name_hi": "Andaman and Nicobar Islands",
    "slug": "andaman-and-nicobar-islands",
    "region": "Unknown",
    "svg_path_id": "an",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Andaman and Nicobar Islands."
  },
  {
    "id": "2",
    "name_en": "Andhra Pradesh",
    "name_hi": "Andhra Pradesh",
    "slug": "andhra-pradesh",
    "region": "Unknown",
    "svg_path_id": "ap",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Andhra Pradesh."
  },
  {
    "id": "3",
    "name_en": "Arunachal Pradesh",
    "name_hi": "Arunachal Pradesh",
    "slug": "arunachal-pradesh",
    "region": "Unknown",
    "svg_path_id": "ar",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Arunachal Pradesh."
  },
  {
    "id": "4",
    "name_en": "Assam",
    "name_hi": "Assam",
    "slug": "assam",
    "region": "Unknown",
    "svg_path_id": "as",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Assam."
  },
  {
    "id": "5",
    "name_en": "Bihar",
    "name_hi": "Bihar",
    "slug": "bihar",
    "region": "Unknown",
    "svg_path_id": "br",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Bihar."
  },
  {
    "id": "6",
    "name_en": "Chandigarh",
    "name_hi": "Chandigarh",
    "slug": "chandigarh",
    "region": "Unknown",
    "svg_path_id": "ch",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Chandigarh."
  },
  {
    "id": "7",
    "name_en": "Chhattisgarh",
    "name_hi": "Chhattisgarh",
    "slug": "chhattisgarh",
    "region": "Unknown",
    "svg_path_id": "ct",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Chhattisgarh."
  },
  {
    "id": "8",
    "name_en": "Dadra and Nagar Haveli",
    "name_hi": "Dadra and Nagar Haveli",
    "slug": "dadra-and-nagar-haveli",
    "region": "Unknown",
    "svg_path_id": "dn",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Dadra and Nagar Haveli."
  },
  {
    "id": "9",
    "name_en": "Daman and Diu",
    "name_hi": "Daman and Diu",
    "slug": "daman-and-diu",
    "region": "Unknown",
    "svg_path_id": "dd",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Daman and Diu."
  },
  {
    "id": "10",
    "name_en": "Delhi",
    "name_hi": "Delhi",
    "slug": "delhi",
    "region": "Unknown",
    "svg_path_id": "dl",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Delhi."
  },
  {
    "id": "11",
    "name_en": "Goa",
    "name_hi": "Goa",
    "slug": "goa",
    "region": "Unknown",
    "svg_path_id": "ga",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Goa."
  },
  {
    "id": "12",
    "name_en": "Gujarat",
    "name_hi": "Gujarat",
    "slug": "gujarat",
    "region": "Unknown",
    "svg_path_id": "gj",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Gujarat."
  },
  {
    "id": "13",
    "name_en": "Haryana",
    "name_hi": "Haryana",
    "slug": "haryana",
    "region": "Unknown",
    "svg_path_id": "hr",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Haryana."
  },
  {
    "id": "14",
    "name_en": "Himachal Pradesh",
    "name_hi": "Himachal Pradesh",
    "slug": "himachal-pradesh",
    "region": "Unknown",
    "svg_path_id": "hp",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Himachal Pradesh."
  },
  {
    "id": "15",
    "name_en": "Jammu and Kashmir",
    "name_hi": "Jammu and Kashmir",
    "slug": "jammu-and-kashmir",
    "region": "Unknown",
    "svg_path_id": "jk",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Jammu and Kashmir."
  },
  {
    "id": "16",
    "name_en": "Jharkhand",
    "name_hi": "Jharkhand",
    "slug": "jharkhand",
    "region": "Unknown",
    "svg_path_id": "jh",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Jharkhand."
  },
  {
    "id": "17",
    "name_en": "Karnataka",
    "name_hi": "Karnataka",
    "slug": "karnataka",
    "region": "Unknown",
    "svg_path_id": "ka",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Karnataka."
  },
  {
    "id": "18",
    "name_en": "Kerala",
    "name_hi": "Kerala",
    "slug": "kerala",
    "region": "Unknown",
    "svg_path_id": "kl",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Kerala."
  },
  {
    "id": "19",
    "name_en": "Lakshadweep",
    "name_hi": "Lakshadweep",
    "slug": "lakshadweep",
    "region": "Unknown",
    "svg_path_id": "ld",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Lakshadweep."
  },
  {
    "id": "20",
    "name_en": "Madhya Pradesh",
    "name_hi": "Madhya Pradesh",
    "slug": "madhya-pradesh",
    "region": "Unknown",
    "svg_path_id": "mp",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Madhya Pradesh."
  },
  {
    "id": "21",
    "name_en": "Maharashtra",
    "name_hi": "Maharashtra",
    "slug": "maharashtra",
    "region": "Unknown",
    "svg_path_id": "mh",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Maharashtra."
  },
  {
    "id": "22",
    "name_en": "Manipur",
    "name_hi": "Manipur",
    "slug": "manipur",
    "region": "Unknown",
    "svg_path_id": "mn",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Manipur."
  },
  {
    "id": "23",
    "name_en": "Meghalaya",
    "name_hi": "Meghalaya",
    "slug": "meghalaya",
    "region": "Unknown",
    "svg_path_id": "ml",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Meghalaya."
  },
  {
    "id": "24",
    "name_en": "Mizoram",
    "name_hi": "Mizoram",
    "slug": "mizoram",
    "region": "Unknown",
    "svg_path_id": "mz",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Mizoram."
  },
  {
    "id": "25",
    "name_en": "Nagaland",
    "name_hi": "Nagaland",
    "slug": "nagaland",
    "region": "Unknown",
    "svg_path_id": "nl",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Nagaland."
  },
  {
    "id": "26",
    "name_en": "Odisha",
    "name_hi": "Odisha",
    "slug": "odisha",
    "region": "Unknown",
    "svg_path_id": "or",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Odisha."
  },
  {
    "id": "27",
    "name_en": "Puducherry",
    "name_hi": "Puducherry",
    "slug": "puducherry",
    "region": "Unknown",
    "svg_path_id": "py",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Puducherry."
  },
  {
    "id": "28",
    "name_en": "Punjab",
    "name_hi": "Punjab",
    "slug": "punjab",
    "region": "Unknown",
    "svg_path_id": "pb",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Punjab."
  },
  {
    "id": "29",
    "name_en": "Rajasthan",
    "name_hi": "Rajasthan",
    "slug": "rajasthan",
    "region": "Unknown",
    "svg_path_id": "rj",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Rajasthan."
  },
  {
    "id": "30",
    "name_en": "Sikkim",
    "name_hi": "Sikkim",
    "slug": "sikkim",
    "region": "Unknown",
    "svg_path_id": "sk",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Sikkim."
  },
  {
    "id": "31",
    "name_en": "Tamil Nadu",
    "name_hi": "Tamil Nadu",
    "slug": "tamil-nadu",
    "region": "Unknown",
    "svg_path_id": "tn",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Tamil Nadu."
  },
  {
    "id": "32",
    "name_en": "Telangana",
    "name_hi": "Telangana",
    "slug": "telangana",
    "region": "Unknown",
    "svg_path_id": "tg",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Telangana."
  },
  {
    "id": "33",
    "name_en": "Tripura",
    "name_hi": "Tripura",
    "slug": "tripura",
    "region": "Unknown",
    "svg_path_id": "tr",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Tripura."
  },
  {
    "id": "34",
    "name_en": "Uttar Pradesh",
    "name_hi": "Uttar Pradesh",
    "slug": "uttar-pradesh",
    "region": "Unknown",
    "svg_path_id": "up",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Uttar Pradesh."
  },
  {
    "id": "35",
    "name_en": "Uttarakhand",
    "name_hi": "Uttarakhand",
    "slug": "uttarakhand",
    "region": "Unknown",
    "svg_path_id": "ut",
    "cover_image_url": null,
    "description": "Explore the rich folk music of Uttarakhand."
  },
  {
    "id": "36",
    "name_en": "West Bengal",
    "name_hi": "West Bengal",
    "slug": "west-bengal",
    "region": "Unknown",
    "svg_path_id": "wb",
    "cover_image_url": null,
    "description": "Explore the rich folk music of West Bengal."
  }
]

const dummyTracks: Record<string, Track[]> = {
  // Andaman and Nicobar Islands
  '1': [
    {
      id: 't_an_1', state_id: '1', title: 'Nicobari Folk Chants', artist: 'Isles Heritage Ensemble',
      instrument_type: 'Bamboo Flute & Shells', audio_url: '/andaman-and-nicobar-islands.mp3',
      duration_seconds: 320, license_type: 'CC-BY', play_count: 145, created_at: new Date().toISOString()
    }
  ],
  // Andhra Pradesh
  '2': [
    {
      id: 't_ap_1', state_id: '2', title: 'Carnatic Kriti in Raga Kalyani', artist: 'Vijayawada Classical Group',
      instrument_type: 'Saraswati Veena', audio_url: '/andhra-pradesh.mp3',
      duration_seconds: 480, license_type: 'CC-BY', play_count: 890, created_at: new Date().toISOString()
    },
    {
      id: 't_ap_2', state_id: '2', title: 'Burra Katha', artist: 'Telugu Folk Masters',
      instrument_type: 'Tambura & Dakki', audio_url: '/andhra-pradesh.mp3',
      duration_seconds: 310, license_type: 'CC-BY', play_count: 420, created_at: new Date().toISOString()
    }
  ],
  // Arunachal Pradesh
  '3': [
    {
      id: 't_ar_1', state_id: '3', title: 'Aji Lhamu Dance Score', artist: 'Monpa Cultural Troupe',
      instrument_type: 'Cymbals & Drums', audio_url: '/arunachal-pradesh.mp3',
      duration_seconds: 245, license_type: 'CC-BY', play_count: 210, created_at: new Date().toISOString()
    }
  ],
  // Assam
  '4': [
    {
      id: 't_as_1', state_id: '4', title: 'Bihu Spring Celebration', artist: 'Brahmaputra Folk Collective',
      instrument_type: 'Pepa & Dhol', audio_url: '/assam.mp3',
      duration_seconds: 315, license_type: 'CC-BY', play_count: 1250, created_at: new Date().toISOString()
    },
    {
      id: 't_as_2', state_id: '4', title: 'Kamrupi Lokgeet', artist: 'Assam Valley Singers',
      instrument_type: 'Dotara', audio_url: '/assam.mp3',
      duration_seconds: 280, license_type: 'CC-BY', play_count: 840, created_at: new Date().toISOString()
    }
  ],
  // Bihar
  '5': [
    {
      id: 't_br_1', state_id: '5', title: 'Chhath Puja Chaiti', artist: 'Bhojpuri Heritage Ensemble',
      instrument_type: 'Harmonium & Dholak', audio_url: '/chhath.mp3',
      duration_seconds: 405, license_type: 'CC-BY', play_count: 3200, created_at: new Date().toISOString()
    }
  ],
  // Chandigarh
  '6': [
    {
      id: 't_ch_1', state_id: '6', title: 'Modern Sufi Fusion', artist: 'City Beautiful Collective',
      instrument_type: 'Tabla & Guitar', audio_url: '/chandigarh.mp3',
      duration_seconds: 275, license_type: 'CC-BY', play_count: 530, created_at: new Date().toISOString()
    }
  ],
  // Chhattisgarh
  '7': [
    {
      id: 't_ct_1', state_id: '7', title: 'Pandavani Tale', artist: 'Raipur Folk Artists',
      instrument_type: 'Ektara', audio_url: '/chhattisgarh.mp3',
      duration_seconds: 520, license_type: 'CC-BY', play_count: 670, created_at: new Date().toISOString()
    }
  ],
  // Dadra and Nagar Haveli
  '8': [
    {
      id: 't_dn_1', state_id: '8', title: 'Tarpa Harvest Dance', artist: 'Warli Tribal Ensemble',
      instrument_type: 'Tarpa', audio_url: '/dadra-and-nagar-haveli.mp3',
      duration_seconds: 195, license_type: 'CC-BY', play_count: 110, created_at: new Date().toISOString()
    }
  ],
  // Daman and Diu
  '9': [
    {
      id: 't_dd_1', state_id: '9', title: 'Coastal Mando', artist: 'Diu Portuguese Heritage Group',
      instrument_type: 'Ghumat', audio_url: '/daman-and-diu.mp3',
      duration_seconds: 230, license_type: 'CC-BY', play_count: 240, created_at: new Date().toISOString()
    }
  ],
  // Delhi
  '10': [
    {
      id: 't_dl_1', state_id: '10', title: 'Nizamuddin Qawwali', artist: 'Sufi Heritage Brothers',
      instrument_type: 'Harmonium & Tabla', audio_url: '/delhi.mp3',
      duration_seconds: 640, license_type: 'CC-BY', play_count: 4500, created_at: new Date().toISOString()
    },
    {
      id: 't_dl_2', state_id: '10', title: 'Hindustani Khayal', artist: 'Delhi Gharana Masters',
      instrument_type: 'Sitar', audio_url: '/delhi.mp3',
      duration_seconds: 480, license_type: 'CC-BY', play_count: 1200, created_at: new Date().toISOString()
    }
  ],
  // Goa
  '11': [
    {
      id: 't_ga_1', state_id: '11', title: 'Dekhnni Folk Song', artist: 'Konkani Cultural Troupe',
      instrument_type: 'Ghumat & Violin', audio_url: '/goa.mp3',
      duration_seconds: 210, license_type: 'CC-BY', play_count: 890, created_at: new Date().toISOString()
    }
  ],
  // Gujarat
  '12': [
    {
      id: 't_gj_1', state_id: '12', title: 'Traditional Garba Raas', artist: 'Saurashtra Folk Artists',
      instrument_type: 'Dhol & Manjira', audio_url: '/gujarat.mp3',
      duration_seconds: 420, license_type: 'CC-BY', play_count: 5600, created_at: new Date().toISOString()
    },
    {
      id: 't_gj_2', state_id: '12', title: 'Dayro Morning Melody', artist: 'Kutch Heritage Singers',
      instrument_type: 'Jantar', audio_url: '/gujarat.mp3',
      duration_seconds: 340, license_type: 'CC-BY', play_count: 980, created_at: new Date().toISOString()
    }
  ],
  // Haryana
  '13': [
    {
      id: 't_hr_1', state_id: '13', title: 'Ragini Epic', artist: 'Rohtak Folk Ensemble',
      instrument_type: 'Sarangi & Been', audio_url: '/haryana.mp3',
      duration_seconds: 380, license_type: 'CC-BY', play_count: 1100, created_at: new Date().toISOString()
    }
  ],
  // Himachal Pradesh
  '14': [
    {
      id: 't_hp_1', state_id: '14', title: 'Kinnauri Nati', artist: 'Himalayan Echoes',
      instrument_type: 'Karnal & Shehnai', audio_url: '/himachal-pradesh.mp3',
      duration_seconds: 290, license_type: 'CC-BY', play_count: 1450, created_at: new Date().toISOString()
    }
  ],
  // Jammu and Kashmir
  '15': [
    {
      id: 't_jk_1', state_id: '15', title: 'Sufiana Kalam', artist: 'Kashmir Valley Masters',
      instrument_type: 'Santoor & Rabab', audio_url: '/jammu-and-kashmir.mp3',
      duration_seconds: 410, license_type: 'CC-BY', play_count: 2200, created_at: new Date().toISOString()
    },
    {
      id: 't_jk_2', state_id: '15', title: 'Rouf Spring Dance', artist: 'Srinagar Folk Chorus',
      instrument_type: 'Tumbaknari', audio_url: '/jammu-and-kashmir.mp3',
      duration_seconds: 260, license_type: 'CC-BY', play_count: 1800, created_at: new Date().toISOString()
    }
  ],
  // Jharkhand
  '16': [
    {
      id: 't_jh_1', state_id: '16', title: 'Santhali Rhythms', artist: 'Chota Nagpur Tribal Artists',
      instrument_type: 'Madal & Bansuri', audio_url: '/jharkhand.mp3',
      duration_seconds: 310, license_type: 'CC-BY', play_count: 670, created_at: new Date().toISOString()
    }
  ],
  // Karnataka
  '17': [
    {
      id: 't_ka_1', state_id: '17', title: 'Mysore Veena Recital', artist: 'Carnatic Virtuosos',
      instrument_type: 'Veena & Mridangam', audio_url: '/karnataka.mp3',
      duration_seconds: 540, license_type: 'CC-BY', play_count: 3100, created_at: new Date().toISOString()
    },
    {
      id: 't_ka_2', state_id: '17', title: 'Dollu Kunitha Beats', artist: 'Karnataka Folk Ensemble',
      instrument_type: 'Dollu', audio_url: '/karnataka.mp3',
      duration_seconds: 245, license_type: 'CC-BY', play_count: 1400, created_at: new Date().toISOString()
    }
  ],
  // Kerala
  '18': [
    {
      id: 't_kl_1', state_id: '18', title: 'Chenda Melam Orchestration', artist: 'Thrissur Temple Musicians',
      instrument_type: 'Chenda & Ilathalam', audio_url: '/kerala.mp3',
      duration_seconds: 420, license_type: 'CC-BY', play_count: 4200, created_at: new Date().toISOString()
    },
    {
      id: 't_kl_2', state_id: '18', title: 'Sopana Sangeetham', artist: 'Kerala Heritage Singers',
      instrument_type: 'Edakka', audio_url: '/kerala.mp3',
      duration_seconds: 380, license_type: 'CC-BY', play_count: 1800, created_at: new Date().toISOString()
    }
  ],
  // Lakshadweep
  '19': [
    {
      id: 't_ld_1', state_id: '19', title: 'Lava Dance Rhythms', artist: 'Minicoy Island Artists',
      instrument_type: 'Drums', audio_url: '/lakshadweep.mp3',
      duration_seconds: 215, license_type: 'CC-BY', play_count: 340, created_at: new Date().toISOString()
    }
  ],
  // Madhya Pradesh
  '20': [
    {
      id: 't_mp_1', state_id: '20', title: 'Malvi Folk Song', artist: 'Malwa Heritage Group',
      instrument_type: 'Dholak & Harmonium', audio_url: '/madhya-pradesh.mp3',
      duration_seconds: 295, license_type: 'CC-BY', play_count: 1100, created_at: new Date().toISOString()
    },
    {
      id: 't_mp_2', state_id: '20', title: 'Dhrupad Classical', artist: 'Gwalior Gharana',
      instrument_type: 'Pakhawaj', audio_url: '/madhya-pradesh.mp3',
      duration_seconds: 680, license_type: 'CC-BY', play_count: 2400, created_at: new Date().toISOString()
    }
  ],
  // Maharashtra
  '21': [
    {
      id: 't_mh_1', state_id: '21', title: 'Lavani Performance', artist: 'Pune Cultural Troupe',
      instrument_type: 'Dholki', audio_url: '/maharashtra.mp3',
      duration_seconds: 310, license_type: 'CC-BY', play_count: 4800, created_at: new Date().toISOString()
    },
    {
      id: 't_mh_2', state_id: '21', title: 'Abhang Devotional', artist: 'Warkari Singers',
      instrument_type: 'Taal & Veena', audio_url: '/maharashtra.mp3',
      duration_seconds: 405, license_type: 'CC-BY', play_count: 3600, created_at: new Date().toISOString()
    }
  ],
  // Manipur
  '22': [
    {
      id: 't_mn_1', state_id: '22', title: 'Nata Sankirtana', artist: 'Imphal Classical Ensemble',
      instrument_type: 'Pung & Kartal', audio_url: '/manipur.mp3',
      duration_seconds: 460, license_type: 'CC-BY', play_count: 950, created_at: new Date().toISOString()
    }
  ],
  // Meghalaya
  '23': [
    {
      id: 't_ml_1', state_id: '23', title: 'Wangala Festival Beats', artist: 'Garo Tribal Musicians',
      instrument_type: 'Dama & Flute', audio_url: '/meghalaya.mp3',
      duration_seconds: 280, license_type: 'CC-BY', play_count: 720, created_at: new Date().toISOString()
    }
  ],
  // Mizoram
  '24': [
    {
      id: 't_mz_1', state_id: '24', title: 'Cheraw Bamboo Dance', artist: 'Aizawl Folk Artists',
      instrument_type: 'Bamboo Staves', audio_url: '/mizoram.mp3',
      duration_seconds: 220, license_type: 'CC-BY', play_count: 850, created_at: new Date().toISOString()
    }
  ],
  // Nagaland
  '25': [
    {
      id: 't_nl_1', state_id: '25', title: 'Hornbill Chants', artist: 'Naga Warrior Chorus',
      instrument_type: 'Log Drum', audio_url: '/nagaland.mp3',
      duration_seconds: 340, license_type: 'CC-BY', play_count: 1300, created_at: new Date().toISOString()
    }
  ],
  // Odisha
  '26': [
    {
      id: 't_or_1', state_id: '26', title: 'Odissi Mardal Symphony', artist: 'Konark Classical Group',
      instrument_type: 'Mardal', audio_url: '/odisha.mp3',
      duration_seconds: 490, license_type: 'CC-BY', play_count: 2100, created_at: new Date().toISOString()
    },
    {
      id: 't_or_2', state_id: '26', title: 'Sambalpuri Folk', artist: 'Western Odisha Ensemble',
      instrument_type: 'Dhol & Nishan', audio_url: '/odisha.mp3',
      duration_seconds: 275, license_type: 'CC-BY', play_count: 3400, created_at: new Date().toISOString()
    }
  ],
  // Puducherry
  '27': [
    {
      id: 't_py_1', state_id: '27', title: 'Auroville Ambient Soundscape', artist: 'Puducherry Fusion Artists',
      instrument_type: 'Synthesizer & Flute', audio_url: '/puducherry.mp3',
      duration_seconds: 410, license_type: 'CC-BY', play_count: 890, created_at: new Date().toISOString()
    }
  ],
  // Punjab
  '28': [
    {
      id: 't_pb_1', state_id: '28', title: 'Bhangra Dhol Beats', artist: 'Amritsar Rhythm Makers',
      instrument_type: 'Dhol & Tumbi', audio_url: '/punjab.mp3',
      duration_seconds: 250, license_type: 'CC-BY', play_count: 6500, created_at: new Date().toISOString()
    },
    {
      id: 't_pb_2', state_id: '28', title: 'Sufi Kafi', artist: 'Punjab Heritage Singers',
      instrument_type: 'Harmonium', audio_url: '/punjab.mp3',
      duration_seconds: 430, license_type: 'CC-BY', play_count: 2800, created_at: new Date().toISOString()
    }
  ],
  // Rajasthan
  '29': [
    {
      id: 't_rj_1', state_id: '29', title: 'Kesariya Balam (Manganiyar)', artist: 'Desert Folk Ensemble',
      instrument_type: 'Kamaicha & Khartal', audio_url: '/rajasthan.mp3',
      duration_seconds: 372, license_type: 'CC-BY', play_count: 8900, created_at: new Date().toISOString()
    },
    {
      id: 't_rj_2', state_id: '29', title: 'Ghoomar Traditional', artist: 'Jaipur Royal Artists',
      instrument_type: 'Dholak & Shehnai', audio_url: '/rajasthan.mp3',
      duration_seconds: 245, license_type: 'CC-BY', play_count: 5200, created_at: new Date().toISOString()
    }
  ],
  // Sikkim
  '30': [
    {
      id: 't_sk_1', state_id: '30', title: 'Maruni Dance Tune', artist: 'Himalayan Folk Group',
      instrument_type: 'Madal', audio_url: '/sikkim.mp3',
      duration_seconds: 290, license_type: 'CC-BY', play_count: 670, created_at: new Date().toISOString()
    }
  ],
  // Tamil Nadu
  '31': [
    {
      id: 't_tn_1', state_id: '31', title: 'Thillana in Raga Dhanashree', artist: 'Chennai Carnatic Masters',
      instrument_type: 'Mridangam & Violin', audio_url: '/tamil-nadu.mp3',
      duration_seconds: 520, license_type: 'CC-BY', play_count: 4500, created_at: new Date().toISOString()
    },
    {
      id: 't_tn_2', state_id: '31', title: 'Nadaswaram Mangala Isai', artist: 'Temple Vidwans',
      instrument_type: 'Nadaswaram & Thavil', audio_url: '/tamil-nadu.mp3',
      duration_seconds: 410, license_type: 'CC-BY', play_count: 3800, created_at: new Date().toISOString()
    }
  ],
  // Telangana
  '32': [
    {
      id: 't_tg_1', state_id: '32', title: 'Bathukamma Festival Song', artist: 'Deccan Folk Voices',
      instrument_type: 'Dappu', audio_url: '/telangana.mp3',
      duration_seconds: 270, license_type: 'CC-BY', play_count: 2400, created_at: new Date().toISOString()
    }
  ],
  // Tripura
  '33': [
    {
      id: 't_tr_1', state_id: '33', title: 'Hojagiri Balance Dance', artist: 'Reang Tribal Artists',
      instrument_type: 'Kham & Sumui', audio_url: '/tripura.mp3',
      duration_seconds: 310, license_type: 'CC-BY', play_count: 560, created_at: new Date().toISOString()
    }
  ],
  // Uttar Pradesh
  '34': [
    {
      id: 't_up_1', state_id: '34', title: 'Banaras Thumri', artist: 'Varanasi Classical Ensemble',
      instrument_type: 'Tabla & Sarangi', audio_url: '/uttar-pradesh.mp3',
      duration_seconds: 580, license_type: 'CC-BY', play_count: 3200, created_at: new Date().toISOString()
    },
    {
      id: 't_up_2', state_id: '34', title: 'Awadhi Kajari', artist: 'Lucknow Folk Singers',
      instrument_type: 'Dholak', audio_url: '/uttar-pradesh.mp3',
      duration_seconds: 340, license_type: 'CC-BY', play_count: 1800, created_at: new Date().toISOString()
    }
  ],
  // Uttarakhand
  '35': [
    {
      id: 't_ut_1', state_id: '35', title: 'Garhwali Jagar Chants', artist: 'Pahari Heritage Group',
      instrument_type: 'Daur & Thali', audio_url: '/uttar-pradesh.mp3',
      duration_seconds: 405, license_type: 'CC-BY', play_count: 1400, created_at: new Date().toISOString()
    }
  ],
  // West Bengal
  '36': [
    {
      id: 't_wb_1', state_id: '36', title: 'Baul Mystical Sangeet', artist: 'Birbhum Baul Collective',
      instrument_type: 'Ektara & Duggi', audio_url: '/odisha.mp3',
      duration_seconds: 360, license_type: 'CC-BY', play_count: 5100, created_at: new Date().toISOString()
    },
    {
      id: 't_wb_2', state_id: '36', title: 'Rabindra Sangeet', artist: 'Kolkata Tagore Singers',
      instrument_type: 'Esraj', audio_url: '/odisha.mp3',
      duration_seconds: 290, license_type: 'CC-BY', play_count: 6700, created_at: new Date().toISOString()
    }
  ]
}

export async function getAllStates(): Promise<State[]> {
  // Use dummy data for Step 1
  return Promise.resolve(dummyStates)
}

export async function getStateBySlug(slug: string): Promise<State | null> {
  const state = dummyStates.find(s => s.slug === slug)
  return Promise.resolve(state || null)
}

export async function getTracksForState(stateId: string): Promise<Track[]> {
  // Simulate network delay
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(dummyTracks[stateId] || [])
    }, 500)
  })
}
