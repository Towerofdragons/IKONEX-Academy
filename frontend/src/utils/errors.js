export function parseErrorMessage(data, defaultMsg = 'An error occurred') {
  if (!data) return defaultMsg;
  if (data.error) return data.error;
  if (data.errors) {
    const messages = [];
    for (const key in data.errors) {
      if (Array.isArray(data.errors[key])) {
        messages.push(...data.errors[key]);
      } else {
        messages.push(data.errors[key]);
      }
    }
    if (messages.length > 0) return messages.join(', ');
  }
  if (data.title) return data.title;
  return defaultMsg;
}
