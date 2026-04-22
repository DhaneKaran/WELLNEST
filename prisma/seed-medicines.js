require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const medicines = [
  {
    name: "Lignocaine + Adrenaline",
    use: "Local anaesthetic",
    dosageForm: "Injection 2% with 5 µg/ml adrenaline",
    price: 45.00,
    stock: 50,
    category: "Anaesthetic",
    prescription: true
  },
  {
    name: "Paracetamol",
    use: "Analgesic / Antipyretic",
    dosageForm: "Tablet 500 mg; Syrup 125 mg/5 ml; Injection 150 mg/ml",
    price: 15.00,
    stock: 200,
    category: "Pain Relief",
    prescription: false
  },
  {
    name: "Acetylsalicylic Acid (Aspirin)",
    use: "Antiplatelet / Analgesic",
    dosageForm: "Tablet 75 mg, 100 mg, 150 mg, 325 mg; 150 mg dispersible",
    price: 25.00,
    stock: 150,
    category: "Pain Relief",
    prescription: false
  },
  {
    name: "Ibuprofen",
    use: "NSAID (pain, inflammation)",
    dosageForm: "Tablet 200 mg, 400 mg; Suspension 100 mg/5 ml",
    price: 30.00,
    stock: 180,
    category: "Pain Relief",
    prescription: false
  },
  {
    name: "Diclofenac Sodium",
    use: "NSAID",
    dosageForm: "Tablet 50 mg, 75 mg SR, 100 mg SR; Injection 25 mg/ml; Gel 20 g tube",
    price: 35.00,
    stock: 120,
    category: "Pain Relief",
    prescription: true
  },
  {
    name: "Tramadol",
    use: "Moderate-severe pain",
    dosageForm: "Capsule 50 mg",
    price: 85.00,
    stock: 30,
    category: "Pain Relief",
    prescription: true
  },
  {
    name: "Chlorpheniramine Maleate",
    use: "Antihistamine (allergy)",
    dosageForm: "Tablet 4 mg; Injection 22.75 mg/ml",
    price: 20.00,
    stock: 100,
    category: "Allergy",
    prescription: false
  },
  {
    name: "Prednisolone",
    use: "Systemic corticosteroid",
    dosageForm: "Tablet 5 mg; Syrup 5 mg/5 ml",
    price: 40.00,
    stock: 80,
    category: "Steroid",
    prescription: true
  },
  {
    name: "Adrenaline (Epinephrine)",
    use: "Anaphylaxis, cardiac arrest",
    dosageForm: "Injection 1 mg/ml",
    price: 120.00,
    stock: 25,
    category: "Emergency",
    prescription: true
  },
  {
    name: "Activated Charcoal",
    use: "Poisoning antidote",
    dosageForm: "Tablet 500 mg",
    price: 55.00,
    stock: 40,
    category: "Emergency",
    prescription: true
  },
  {
    name: "Carbamazepine",
    use: "Antiepileptic",
    dosageForm: "Tablet 100 mg, 200 mg; Syrup 100 mg/5 ml",
    price: 75.00,
    stock: 60,
    category: "Neurology",
    prescription: true
  },
  {
    name: "Phenytoin Sodium",
    use: "Antiepileptic",
    dosageForm: "Tablet 50 mg, 100 mg; Suspension 30 mg/5 ml",
    price: 65.00,
    stock: 45,
    category: "Neurology",
    prescription: true
  },
  {
    name: "Amoxicillin",
    use: "Broad-spectrum antibiotic",
    dosageForm: "Capsule 250 mg, 500 mg; Suspension 125 mg/5 ml",
    price: 50.00,
    stock: 90,
    category: "Antibiotic",
    prescription: true
  },
  {
    name: "Azithromycin",
    use: "Macrolide antibiotic",
    dosageForm: "Tablet 250 mg, 500 mg; Suspension 100 mg/5 ml",
    price: 95.00,
    stock: 70,
    category: "Antibiotic",
    prescription: true
  },
  {
    name: "Ciprofloxacin",
    use: "Fluoroquinolone antibiotic",
    dosageForm: "Tablet 250 mg, 500 mg",
    price: 60.00,
    stock: 85,
    category: "Antibiotic",
    prescription: true
  },
  {
    name: "Metronidazole",
    use: "Antiprotozoal / Anaerobic infections",
    dosageForm: "Tablet 200 mg, 400 mg; Suspension 200 mg/5 ml",
    price: 45.00,
    stock: 75,
    category: "Antibiotic",
    prescription: true
  },
  {
    name: "Ranitidine",
    use: "H₂-blocker (peptic ulcer)",
    dosageForm: "Tablet 150 mg; Injection 50 mg/2 ml",
    price: 35.00,
    stock: 110,
    category: "Gastrointestinal",
    prescription: false
  },
  {
    name: "Omeprazole",
    use: "Proton-pump inhibitor (ulcer)",
    dosageForm: "Capsule 20 mg",
    price: 55.00,
    stock: 95,
    category: "Gastrointestinal",
    prescription: true
  },
  {
    name: "Metformin",
    use: "Oral antidiabetic (type 2 DM)",
    dosageForm: "Tablet 500 mg, 850 mg",
    price: 40.00,
    stock: 130,
    category: "Diabetes",
    prescription: true
  },
  {
    name: "Levothyroxine",
    use: "Thyroid hormone replacement",
    dosageForm: "Tablet 12.5 µg, 25 µg, 50 µg, 100 µg",
    price: 70.00,
    stock: 65,
    category: "Endocrinology",
    prescription: true
  }
]

async function main() {
  console.log('Seeding medicines...')
  
  try {
    // First, delete all existing medicines
    await prisma.medicine.deleteMany()
    
    // Then create all medicines
    for (const medicine of medicines) {
      await prisma.medicine.create({
        data: medicine,
      })
    }
    
    console.log('Medicines seeded successfully!')
  } catch (error) {
    console.error('Error seeding medicines:', error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 