export const HARAM_KEYWORDS = [
  'casino', 'gambling', 'bet', 'betting', 'poker', 'slot', 'roulette',
  'alcohol', 'liquor', 'beer', 'wine', 'vodka', 'whiskey', 'rum',
  'porn', 'sex', 'adult', 'dating', 'nsfw', 'onlyfans', 'nude', 'naked', 'escort',
  'pork', 'pig', 'ham', 'bacon', 'swine',
  'interest', 'usury', 'riba', 'loan', 'mortgage', 'credit card'
];

export const isHaram = (text: string): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  // We use word boundaries or just simple matching? Simple string includes provides broader catch,
  // but may lead to false positives (e.g. 'alphabet' matching 'bet'). Let's use word boundary matching.
  
  return HARAM_KEYWORDS.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(lowerText);
  });
};

export const filterHaramTasks = <T extends { title?: string, url?: string, description?: string }>(tasks: T[]): T[] => {
  return tasks.filter(task => {
    if (task.title && isHaram(task.title)) return false;
    if (task.url && isHaram(task.url)) return false;
    if (task.description && isHaram(task.description)) return false;
    return true;
  });
};
