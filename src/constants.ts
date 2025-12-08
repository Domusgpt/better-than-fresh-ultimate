
import { StoryCard } from './types';

export const STORY_CARDS: StoryCard[] = [
  {
    id: '01',
    type: 'process',
    title: 'The Frozen Standard',
    subtitle: 'Super-Frozen Technology',
    coordinates: 'TEMP -60°C',
    description: 'Sashimi-grade quality locked in at the cellular level. Superior to fresh.',
    fullContent: 'We challenge the "Fresh is Best" myth. Our fleet utilizes advanced super-freezing technology immediately upon catch. By dropping core temperatures to -60°C within minutes, we prevent the formation of large ice crystals that damage cell membranes. The result? When thawed, our Yellowfin and Swordfish exhibit zero drip loss, firmer texture, and a suspended state of freshness that "fresh" logistics simply cannot compete with.',
    image: '/images/seafood-display.jpg',
  },
  {
    id: '02',
    type: 'product',
    title: 'Yellowfin Tuna',
    subtitle: 'Thunnus albacares',
    coordinates: 'FAO ZONE 77',
    description: 'AAA Saku Blocks and Loins. CO-Treated for vibrant color retention.',
    fullContent: 'Our crown jewel. Wild-caught Panamanian Yellowfin, processed into precision-cut Saku blocks and Center-Cut Loins. We utilize Tasteless Smoke (CO) treatment to ensure the myoglobin retains its ruby-red vibrancy during the frozen state. Ideal for poke, sushi, or searing. Consistency in size, color, and grading (AAA/AA) allows for precise food cost calculation and zero waste in the kitchen.',
    image: '/images/tuna-saku-block.png',
  },
  {
    id: '03',
    type: 'catalog',
    title: 'The Premium Catch',
    subtitle: 'Inventory Matrix',
    coordinates: 'STOCK: LIVE',
    description: 'Explore our full range. Swordfish, Mahi, Snapper, Grouper.',
    fullContent: 'Our supply chain extends beyond Tuna. We provide a full suite of premium frozen seafood, individually vacuum packed (IVP) for maximum shelf life and inventory flexibility. From the dense steak-texture of Swordfish to the delicate flake of Red Snapper, every item adheres to our rigid vertical integration standards.',
    image: '/images/frozen-fish-case.jpg',
    productList: [
      {
        name: 'Swordfish Steaks',
        description: 'Xiphias gladius. Clipper quality, center-cut steaks with bloodline removed. Firm, meaty texture ideal for grilling.',
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a7270028d?q=80&w=2574&auto=format&fit=crop',
        specs: [
          { label: 'Cut', value: 'Center Cut Steak' },
          { label: 'Pack', value: 'IVP 10oz / 50lb Master' },
          { label: 'Origin', value: 'Ecuador / Panama' }
        ]
      },
      {
        name: 'Mahi Mahi',
        description: 'Coryphaena hippurus. Skin-on or skinless fillets. Sweet, mild flavor with a large, moist flake. CO-treated for color.',
        image: 'https://images.unsplash.com/photo-1529124346403-61b5836d8322?q=80&w=2574&auto=format&fit=crop',
        specs: [
          { label: 'Cut', value: 'Fletches / Portions' },
          { label: 'Grade', value: 'Sashimi / Grill' },
          { label: 'Pack', value: 'IVP 6-8oz' }
        ]
      },
      {
        name: 'Red Snapper',
        description: 'Lutjanus campechanus. Natural fillets, skin-on, scaled. A versatile menu staple with a signature red skin tone.',
        image: 'https://images.unsplash.com/photo-1535568822596-d6e387d9524d?q=80&w=2564&auto=format&fit=crop',
        specs: [
          { label: 'Cut', value: 'Natural Fillet' },
          { label: 'Size', value: '8/10 oz' },
          { label: 'Pack', value: 'IQF / 10lb Box' }
        ]
      },
      {
        name: 'Black Grouper',
        description: 'Mycteroperca bonaci. Lean, moist meat with a distinctive yet mild flavor. Large flakes and firm texture.',
        image: 'https://images.unsplash.com/photo-1621857263378-883347834689?q=80&w=2574&auto=format&fit=crop',
        specs: [
          { label: 'Cut', value: 'Skinless Fillet' },
          { label: 'Size', value: '6/8 oz' },
          { label: 'Origin', value: 'Gulf / Caribbean' }
        ]
      }
    ]
  },
  {
    id: '04',
    type: 'ethos',
    title: 'Vertical Integration',
    subtitle: 'Chain of Custody',
    coordinates: '09°00′N 79°30′W',
    description: 'We own the boats. We own the plants. Total traceability.',
    fullContent: 'In an industry rife with opacity, Pono Marketing x Fishmonger Inc offers total transparency. We do not aggregate from unknown artisanal fleets. We operate the longliners. We manage the HACCP-certified processing plants in Central America. We control the cold chain logistics. This allows us to guarantee species authenticity and ethical labor practices.',
    image: '/images/panama-vessel.jpg',
  }
];
