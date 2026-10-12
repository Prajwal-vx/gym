/* Browser-only persistence adapter. A server implementation can replace this
   boundary later while keeping form and dashboard code independent of storage. */
const STORAGE = Object.freeze({
  inquiries: 'ig_inquiries',
  trials: 'ig_trials',
  messages: 'ig_messages',
  photos: 'ig_photos',
  members: 'ig_members',
  memberSession: 'ig_member_session',
});

const MAX_RECORDS = 200;

function getData(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch (error) {
    console.error('Unable to read saved site data:', error);
    return [];
  }
}

function saveData(key, data) {
  const existing = getData(key);
  existing.unshift(data);
  if (existing.length > MAX_RECORDS) existing.length = MAX_RECORDS;
  try {
    localStorage.setItem(key, JSON.stringify(existing));
    return true;
  } catch (error) {
    console.error('Unable to save site data:', error);
    showToast('Could not save this information. Browser storage may be full or unavailable.');
    return false;
  }
}
