export interface FAQCategory {
  id: string;
  title: string;
  questions: FAQItem[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export class FAQService {
  private readonly faqData: FAQCategory[] = [
    {
      id: 'risk-levels',
      title: 'Understanding Risk Levels',
      questions: [
        {
          question: 'What do the risk levels mean?',
          answer: 'STABLE: Safe for all uses. LOW/MODERATE: Safe for drinking, minor fluctuations. HIGH: BOIL WATER ORDER - do not drink without boiling. CRITICAL: UNSAFE FOR ALL USES - seek alternative water sources immediately.',
        },
        {
          question: 'How is the risk level calculated?',
          answer: 'The risk level is calculated from multiple water quality parameters (pH, chlorine, turbidity, temperature, lead) using a weighted formula. The system updates every 60 seconds with real-time data.',
        },
        {
          question: 'What should I do when the risk level changes?',
          answer: 'Check the Health Advisory section for specific instructions. During HIGH or CRITICAL alerts, follow all safety instructions immediately. The dashboard updates automatically to show current status.',
        },
      ],
    },
    {
      id: 'health-advisories',
      title: 'Health & Safety',
      questions: [
        {
          question: 'What should I do during a BOIL WATER ORDER?',
          answer: 'Bring water to a rolling boil for at least 1 minute before using for drinking, cooking, making ice, or brushing teeth. Let it cool before using. Bathing and washing are generally safe.',
        },
        {
          question: 'When is water unsafe for all uses?',
          answer: 'During CRITICAL alerts, do not use water for any purpose. Seek alternative water sources immediately and contact local authorities for guidance.',
        },
        {
          question: 'What if I experience symptoms after using water?',
          answer: 'Stop using water immediately, seek medical attention, and report it through the "Report Issue" feature on this dashboard.',
        },
      ],
    },
    {
      id: 'chemical-parameters',
      title: 'Water Quality Parameters',
      questions: [
        {
          question: 'What chemicals are monitored?',
          answer: 'We monitor pH (7.0-8.5), Chlorine Residual (0.2-2.0 mg/L), Turbidity (<1.0 NTU), Water Temperature (15-25°C), and Lead Concentration (<0.015 mg/L). These are key indicators of water safety.',
        },
        {
          question: 'Why do these parameters matter?',
          answer: 'pH affects taste and pipe corrosion. Chlorine kills harmful bacteria. Turbidity indicates filtration effectiveness. Temperature affects disinfection. Lead is toxic and must be minimized.',
        },
        {
          question: 'How often is the data updated?',
          answer: 'All parameters are continuously monitored using automated sensors and updated every 60 seconds. The dashboard shows real-time data from the water treatment facility.',
        },
      ],
    },
  ];

  getAllFAQs(): FAQCategory[] {
    return this.faqData;
  }

  getFAQByCategory(categoryId: string): FAQCategory | undefined {
    return this.faqData.find((category) => category.id === categoryId);
  }

  searchFAQs(searchTerm: string): FAQItem[] {
    const term = searchTerm.toLowerCase();
    const results: FAQItem[] = [];

    this.faqData.forEach((category) => {
      category.questions.forEach((item) => {
        if (
          item.question.toLowerCase().includes(term) ||
          item.answer.toLowerCase().includes(term)
        ) {
          results.push(item);
        }
      });
    });

    return results;
  }
}

export const faqService = new FAQService();

