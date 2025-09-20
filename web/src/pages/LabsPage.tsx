import { useState } from 'react'
import { FiSearch, FiArrowLeft, FiClock, FiDollarSign } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

interface LabTest {
  id: string
  name: string
  category: string
  price: string
  duration: string
  description: string
  preparation: string
}

const labTests: LabTest[] = [
  // Blood Tests
  {
    id: '1',
    name: 'Complete Blood Count (CBC)',
    category: 'Blood Test',
    price: '₹300-500',
    duration: '2-4 hours',
    description: 'Measures red blood cells, white blood cells, platelets, and hemoglobin levels',
    preparation: 'No special preparation required'
  },
  {
    id: '2',
    name: 'Blood Sugar (Fasting)',
    category: 'Blood Test',
    price: '₹200-400',
    duration: '2-3 hours',
    description: 'Measures glucose levels after 8-12 hours of fasting',
    preparation: 'Fast for 8-12 hours before test'
  },
  {
    id: '3',
    name: 'Blood Sugar (Post Prandial)',
    category: 'Blood Test',
    price: '₹200-400',
    duration: '2-3 hours',
    description: 'Measures glucose levels 2 hours after eating',
    preparation: 'Eat normal meal, test after 2 hours'
  },
  {
    id: '4',
    name: 'HbA1c (Glycated Hemoglobin)',
    category: 'Blood Test',
    price: '₹500-800',
    duration: '4-6 hours',
    description: 'Measures average blood sugar over 2-3 months',
    preparation: 'No special preparation required'
  },
  {
    id: '5',
    name: 'Lipid Profile',
    category: 'Blood Test',
    price: '₹400-600',
    duration: '4-6 hours',
    description: 'Measures cholesterol, triglycerides, HDL, LDL levels',
    preparation: 'Fast for 12-14 hours before test'
  },
  {
    id: '6',
    name: 'Thyroid Function Test (T3, T4, TSH)',
    category: 'Blood Test',
    price: '₹600-1000',
    duration: '4-6 hours',
    description: 'Evaluates thyroid gland function',
    preparation: 'No special preparation required'
  },
  {
    id: '7',
    name: 'Liver Function Test (LFT)',
    category: 'Blood Test',
    price: '₹500-800',
    duration: '4-6 hours',
    description: 'Measures liver enzymes and proteins',
    preparation: 'No special preparation required'
  },
  {
    id: '8',
    name: 'Kidney Function Test (KFT)',
    category: 'Blood Test',
    price: '₹400-600',
    duration: '4-6 hours',
    description: 'Measures kidney function markers like creatinine, urea',
    preparation: 'No special preparation required'
  },
  {
    id: '9',
    name: 'Vitamin D3',
    category: 'Blood Test',
    price: '₹800-1200',
    duration: '4-6 hours',
    description: 'Measures vitamin D levels in blood',
    preparation: 'No special preparation required'
  },
  {
    id: '10',
    name: 'Vitamin B12',
    category: 'Blood Test',
    price: '₹600-900',
    duration: '4-6 hours',
    description: 'Measures vitamin B12 levels',
    preparation: 'No special preparation required'
  },
  {
    id: '11',
    name: 'Iron Studies',
    category: 'Blood Test',
    price: '₹500-800',
    duration: '4-6 hours',
    description: 'Measures iron levels, ferritin, TIBC',
    preparation: 'No special preparation required'
  },
  {
    id: '12',
    name: 'ESR (Erythrocyte Sedimentation Rate)',
    category: 'Blood Test',
    price: '₹200-400',
    duration: '2-4 hours',
    description: 'Measures inflammation markers',
    preparation: 'No special preparation required'
  },

  // Full Body Checkups
  {
    id: '13',
    name: 'Basic Health Checkup',
    category: 'Full Body Checkup',
    price: '₹1500-2500',
    duration: '1-2 days',
    description: 'CBC, Blood Sugar, Lipid Profile, LFT, KFT, Urine Analysis',
    preparation: 'Fast for 12 hours before test'
  },
  {
    id: '14',
    name: 'Executive Health Checkup',
    category: 'Full Body Checkup',
    price: '₹3000-5000',
    duration: '1-2 days',
    description: 'Comprehensive health screening including cardiac risk assessment',
    preparation: 'Fast for 12 hours before test'
  },
  {
    id: '15',
    name: 'Senior Citizen Health Checkup',
    category: 'Full Body Checkup',
    price: '₹2500-4000',
    duration: '1-2 days',
    description: 'Age-appropriate health screening for 60+ years',
    preparation: 'Fast for 12 hours before test'
  },
  {
    id: '16',
    name: 'Women\'s Health Checkup',
    category: 'Full Body Checkup',
    price: '₹2000-3500',
    duration: '1-2 days',
    description: 'Comprehensive screening including hormonal tests',
    preparation: 'Fast for 12 hours before test'
  },
  {
    id: '17',
    name: 'Child Health Checkup',
    category: 'Full Body Checkup',
    price: '₹1000-2000',
    duration: '1 day',
    description: 'Age-appropriate screening for children',
    preparation: 'No special preparation required'
  },

  // Cardiac Tests
  {
    id: '18',
    name: 'ECG (Electrocardiogram)',
    category: 'Cardiac Test',
    price: '₹300-500',
    duration: '15-30 minutes',
    description: 'Records electrical activity of the heart',
    preparation: 'No special preparation required'
  },
  {
    id: '19',
    name: 'Echocardiogram',
    category: 'Cardiac Test',
    price: '₹1500-2500',
    duration: '30-45 minutes',
    description: 'Ultrasound imaging of the heart',
    preparation: 'No special preparation required'
  },
  {
    id: '20',
    name: 'Treadmill Test (TMT)',
    category: 'Cardiac Test',
    price: '₹2000-3000',
    duration: '30-45 minutes',
    description: 'Exercise stress test for heart function',
    preparation: 'Wear comfortable clothes and shoes'
  },
  {
    id: '21',
    name: 'Holter Monitoring',
    category: 'Cardiac Test',
    price: '₹2500-4000',
    duration: '24-48 hours',
    description: 'Continuous ECG monitoring for 24-48 hours',
    preparation: 'No special preparation required'
  },

  // Imaging Tests
  {
    id: '22',
    name: 'Chest X-Ray',
    category: 'Imaging Test',
    price: '₹400-600',
    duration: '15-30 minutes',
    description: 'X-ray imaging of chest and lungs',
    preparation: 'Remove jewelry and metal objects'
  },
  {
    id: '23',
    name: 'Abdominal Ultrasound',
    category: 'Imaging Test',
    price: '₹800-1200',
    duration: '30-45 minutes',
    description: 'Ultrasound imaging of abdominal organs',
    preparation: 'Fast for 6-8 hours before test'
  },
  {
    id: '24',
    name: 'CT Scan (Chest)',
    category: 'Imaging Test',
    price: '₹3000-5000',
    duration: '30-45 minutes',
    description: 'Detailed cross-sectional imaging of chest',
    preparation: 'Fast for 4-6 hours before test'
  },
  {
    id: '25',
    name: 'MRI (Brain)',
    category: 'Imaging Test',
    price: '₹5000-8000',
    duration: '45-60 minutes',
    description: 'Magnetic resonance imaging of brain',
    preparation: 'Remove all metal objects and jewelry'
  },

  // Specialized Tests
  {
    id: '26',
    name: 'Pap Smear',
    category: 'Specialized Test',
    price: '₹500-800',
    duration: '15-30 minutes',
    description: 'Cervical cancer screening test',
    preparation: 'Avoid douching 48 hours before test'
  },
  {
    id: '27',
    name: 'PSA (Prostate Specific Antigen)',
    category: 'Specialized Test',
    price: '₹600-900',
    duration: '4-6 hours',
    description: 'Prostate cancer screening test',
    preparation: 'No special preparation required'
  },
  {
    id: '28',
    name: 'Allergy Panel',
    category: 'Specialized Test',
    price: '₹2000-4000',
    duration: '4-6 hours',
    description: 'Tests for common allergens',
    preparation: 'No special preparation required'
  },
  {
    id: '29',
    name: 'Food Intolerance Test',
    category: 'Specialized Test',
    price: '₹3000-5000',
    duration: '4-6 hours',
    description: 'Identifies food sensitivities',
    preparation: 'No special preparation required'
  },
  {
    id: '30',
    name: 'Hormone Panel (Female)',
    category: 'Specialized Test',
    price: '₹1500-2500',
    duration: '4-6 hours',
    description: 'Comprehensive female hormone testing',
    preparation: 'Test on specific day of menstrual cycle'
  }
]

export default function LabsPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const categories = ['All', 'Blood Test', 'Full Body Checkup', 'Cardiac Test', 'Imaging Test', 'Specialized Test']

  const filteredTests = labTests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || test.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleBookTest = (test: LabTest) => {
    // For now, just show an alert. In a real app, this would open a booking form
    alert(`Booking ${test.name}\nPrice: ${test.price}\nDuration: ${test.duration}\n\nPreparation: ${test.preparation}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/home')}
          className="p-2 text-teal-300 hover:text-teal-200 transition-colors"
        >
          <FiArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Medical Tests & Labs</h1>
          <p className="text-gray-300 text-sm">Find and book medical tests</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for tests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-4">
        <h3 className="text-white font-semibold mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-teal-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Tests List */}
      <div className="space-y-3">
        <div className="text-white/80 text-sm">
          Showing {filteredTests.length} of {labTests.length} tests
        </div>
        
        {filteredTests.map(test => (
          <div
            key={test.id}
            className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-white/20 p-4 hover:bg-white/15 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg">{test.name}</h3>
                <p className="text-teal-300 text-sm font-medium">{test.category}</p>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">{test.price}</div>
                <div className="text-gray-400 text-xs flex items-center gap-1">
                  <FiClock className="w-3 h-3" />
                  {test.duration}
                </div>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-3">{test.description}</p>
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-400">
                <strong>Preparation:</strong> {test.preparation}
              </div>
              <button
                onClick={() => handleBookTest(test)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Book Test
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTests.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No tests found matching your search.</p>
        </div>
      )}
    </div>
  )
}
