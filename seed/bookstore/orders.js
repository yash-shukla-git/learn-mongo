const { ObjectId } = require('mongodb');
const { bookIds } = require('./books');

const customers = [
  { name: 'Alice Chen',      email: 'alice@example.com',   city: 'New York',    country: 'USA' },
  { name: 'Bob Martinez',    email: 'bob@example.com',     city: 'Los Angeles', country: 'USA' },
  { name: 'Clara Osei',      email: 'clara@example.com',   city: 'London',      country: 'UK' },
  { name: 'David Kim',       email: 'david@example.com',   city: 'Seoul',       country: 'South Korea' },
  { name: 'Elena Rossi',     email: 'elena@example.com',   city: 'Rome',        country: 'Italy' },
  { name: 'Fatima Al-Amin',  email: 'fatima@example.com',  city: 'Dubai',       country: 'UAE' },
  { name: 'Guo Wei',         email: 'guo@example.com',     city: 'Shanghai',    country: 'China' },
  { name: 'Hannah Schmidt',  email: 'hannah@example.com',  city: 'Berlin',      country: 'Germany' },
  { name: 'Ivan Petrov',     email: 'ivan@example.com',    city: 'Moscow',      country: 'Russia' },
  { name: 'Jasmine Patel',   email: 'jasmine@example.com', city: 'Mumbai',      country: 'India' },
];

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function randomInt(min, max) { return Math.floor(min + (max - min + 1) * 0.5); }
function pick(arr, seed) { return arr[seed % arr.length]; }

const orders = [];
const baseDate = new Date('2024-01-01');

for (let i = 0; i < 100; i++) {
  const customer = pick(customers, i * 7 + 3);
  const numItems = 1 + (i % 3);
  const items = [];
  let totalAmount = 0;

  for (let j = 0; j < numItems; j++) {
    const book = { _id: bookIds[(i * 3 + j * 11) % bookIds.length] };
    const price = 9.99 + ((i + j) % 10);
    const qty = 1 + (j % 2);
    items.push({
      bookId: book._id,
      quantity: qty,
      unitPrice: parseFloat(price.toFixed(2)),
    });
    totalAmount += price * qty;
  }

  const dayOffset = (i * 3) % 365;
  const orderDate = new Date(baseDate.getTime() + dayOffset * 86400000);

  orders.push({
    _id: new ObjectId(),
    customer: {
      name: customer.name,
      email: customer.email,
      address: { city: customer.city, country: customer.country },
    },
    items,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    status: pick(statuses, i),
    orderedAt: orderDate,
    updatedAt: new Date(orderDate.getTime() + ((i % 5) * 86400000)),
    promoCode: i % 5 === 0 ? 'SAVE10' : null,
  });
}

module.exports = { orders };
