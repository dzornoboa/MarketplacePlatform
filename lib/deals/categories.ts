export const dealCategories = [
  'Agriculture And Agribusiness',
  'Energy And Renewables',
  'Infrastructure And Construction',
  'Manufacturing And Industrial',
  'Mining And Natural Resources',
  'Technology And Digital',
  'Financial Services',
  'Healthcare And Life Sciences',
  'Real Estate',
  'Logistics And Transport',
  'Tourism And Hospitality',
  'Consumer And Retail',
  'Professional Services',
  'Education And Training',
  'Government And Public Sector',
  'Other',
] as const

export type DealCategory = (typeof dealCategories)[number]

export function categoryTag(category: string) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
