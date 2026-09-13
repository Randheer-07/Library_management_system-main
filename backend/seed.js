const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@library.com' },
    update: {},
    create: {
      email: 'admin@library.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      phone: '555-0100',
    },
  });
  console.log('Admin user created:', admin.email);

  // Create librarian user
  const libPassword = await bcrypt.hash('lib123', 12);
  const librarian = await prisma.user.upsert({
    where: { email: 'librarian@library.com' },
    update: {},
    create: {
      email: 'librarian@library.com',
      password: libPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'LIBRARIAN',
      phone: '555-0101',
    },
  });
  console.log('Librarian user created:', librarian.email);

  // Create member users
  const memberPassword = await bcrypt.hash('member123', 12);
  const memberData = [
    { email: 'john@example.com', firstName: 'John', lastName: 'Smith', phone: '555-0201' },
    { email: 'emma@example.com', firstName: 'Emma', lastName: 'Davis', phone: '555-0202' },
    { email: 'michael@example.com', firstName: 'Michael', lastName: 'Brown', phone: '555-0203' },
    { email: 'olivia@example.com', firstName: 'Olivia', lastName: 'Wilson', phone: '555-0204' },
    { email: 'david@example.com', firstName: 'David', lastName: 'Martinez', phone: '555-0205' },
  ];

  const members = [];
  for (const md of memberData) {
    const user = await prisma.user.upsert({
      where: { email: md.email },
      update: {},
      create: { ...md, password: memberPassword, role: 'MEMBER' },
    });
    const member = await prisma.member.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        memberNumber: `MEM-${user.id.slice(-6).toUpperCase()}`,
        maxLoans: 5,
      },
    });
    members.push(member);
  }
  console.log(`${members.length} member users created`);

  // Create authors
  const authorData = [
    { firstName: 'George', lastName: 'Orwell', nationality: 'British', biography: 'English novelist and essayist, known for works like 1984 and Animal Farm.' },
    { firstName: 'Jane', lastName: 'Austen', nationality: 'British', biography: 'English novelist known for her social commentary and wit.' },
    { firstName: 'Harper', lastName: 'Lee', nationality: 'American', biography: 'American novelist best known for To Kill a Mockingbird.' },
    { firstName: 'J.K.', lastName: 'Rowling', nationality: 'British', biography: 'British author of the Harry Potter series.' },
    { firstName: 'Stephen', lastName: 'King', nationality: 'American', biography: 'American author of horror, suspense, and fantasy novels.' },
    { firstName: 'Agatha', lastName: 'Christie', nationality: 'British', biography: 'English writer known for her detective novels.' },
    { firstName: 'Ernest', lastName: 'Hemingway', nationality: 'American', biography: 'American novelist and journalist, Nobel Prize winner.' },
    { firstName: 'Toni', lastName: 'Morrison', nationality: 'American', biography: 'American novelist and Nobel Prize winner.' },
  ];

  const authors = [];
  for (const ad of authorData) {
    const author = await prisma.author.create({ data: ad });
    authors.push(author);
  }
  console.log(`${authors.length} authors created`);

  // Create categories
  const categoryData = [
    { name: 'Fiction', description: 'Literary works of imagination' },
    { name: 'Non-Fiction', description: 'Factual and informational works' },
    { name: 'Science Fiction', description: 'Speculative fiction dealing with futuristic concepts' },
    { name: 'Mystery', description: 'Crime and detective fiction' },
    { name: 'Romance', description: 'Love stories and romantic fiction' },
    { name: 'Biography', description: 'Life stories of real people' },
    { name: 'History', description: 'Historical accounts and analyses' },
    { name: 'Science', description: 'Scientific literature' },
    { name: 'Children', description: 'Books for young readers' },
    { name: 'Reference', description: 'Encyclopedias, dictionaries, and reference works' },
  ];

  const categories = [];
  for (const cd of categoryData) {
    const cat = await prisma.category.create({ data: cd });
    categories.push(cat);
  }
  console.log(`${categories.length} categories created`);

  // Create books
  const bookData = [
    { title: '1984', isbn: '978-0451524935', description: 'A dystopian social science fiction novel set in a totalitarian society.', publisher: 'Signet Classics', publishYear: 1949, language: 'English', pageCount: 328, totalCopies: 3, authorIds: [0], categoryIds: [0, 2] },
    { title: 'Animal Farm', isbn: '978-0451526342', description: 'An allegorical novella reflecting events leading up to the Russian Revolution.', publisher: 'Signet Classics', publishYear: 1945, language: 'English', pageCount: 141, totalCopies: 2, authorIds: [0], categoryIds: [0, 2] },
    { title: 'Pride and Prejudice', isbn: '978-0141439518', description: 'A romantic novel of manners following character development through marriage, morality, and social class.', publisher: 'Penguin Classics', publishYear: 1813, language: 'English', pageCount: 432, totalCopies: 2, authorIds: [1], categoryIds: [0, 4] },
    { title: 'To Kill a Mockingbird', isbn: '978-0060935467', description: 'A novel about racial injustice in the Deep South.', publisher: 'Harper Perennial', publishYear: 1960, language: 'English', pageCount: 336, totalCopies: 3, authorIds: [2], categoryIds: [0] },
    { title: 'Harry Potter and the Philosopher\'s Stone', isbn: '978-0747532699', description: 'A young wizard discovers his magical heritage.', publisher: 'Bloomsbury', publishYear: 1997, language: 'English', pageCount: 223, totalCopies: 4, authorIds: [3], categoryIds: [0, 9] },
    { title: 'Harry Potter and the Chamber of Secrets', isbn: '978-0747538493', description: 'The second year at Hogwarts brings new dangers.', publisher: 'Bloomsbury', publishYear: 1998, language: 'English', pageCount: 360, totalCopies: 3, authorIds: [3], categoryIds: [0, 9] },
    { title: 'The Shining', isbn: '978-0307743657', description: 'A family heads to an isolated hotel for the winter.', publisher: 'Anchor', publishYear: 1977, language: 'English', pageCount: 447, totalCopies: 2, authorIds: [4], categoryIds: [0, 3] },
    { title: 'IT', isbn: '978-1501142970', description: 'A group of friends face their worst fears.', publisher: 'Scribner', publishYear: 1986, language: 'English', pageCount: 1138, totalCopies: 2, authorIds: [4], categoryIds: [0, 3] },
    { title: 'Murder on the Orient Express', isbn: '978-0062693662', description: 'Detective Hercule Poirot investigates a murder on a train.', publisher: 'Harper Paperbacks', publishYear: 1934, language: 'English', pageCount: 256, totalCopies: 2, authorIds: [5], categoryIds: [0, 3] },
    { title: 'The Old Man and the Sea', isbn: '978-0684801221', description: 'A story of an aging fisherman and his struggle with a giant marlin.', publisher: 'Scribner', publishYear: 1952, language: 'English', pageCount: 128, totalCopies: 2, authorIds: [6], categoryIds: [0] },
    { title: 'Beloved', isbn: '978-1400033416', description: 'A profound exploration of slavery and its lasting effects.', publisher: 'Vintage', publishYear: 1987, language: 'English', pageCount: 321, totalCopies: 2, authorIds: [7], categoryIds: [0] },
    { title: 'A Brief History of Time', isbn: '978-0553380163', description: 'A landmark volume in science writing by one of the great minds of our time.', publisher: 'Bantam', publishYear: 1988, language: 'English', pageCount: 256, totalCopies: 2, authorIds: [], categoryIds: [1, 7] },
    { title: 'The Art of War', isbn: '978-1599869773', description: 'An ancient Chinese military treatise.', publisher: 'Filiquarian', publishYear: -500, language: 'Chinese', pageCount: 68, totalCopies: 2, authorIds: [], categoryIds: [1, 7] },
    { title: 'Sapiens: A Brief History of Humankind', isbn: '978-0062316097', description: 'An exploration of how Homo sapiens came to dominate the world.', publisher: 'Harper', publishYear: 2015, language: 'English', pageCount: 464, totalCopies: 2, authorIds: [], categoryIds: [1, 7] },
    { title: 'Dune', isbn: '978-0441013593', description: 'A science fiction epic set on the desert planet Arrakis.', publisher: 'Ace', publishYear: 1965, language: 'English', pageCount: 688, totalCopies: 3, authorIds: [], categoryIds: [0, 2] },
  ];

  const books = [];
  for (const bd of bookData) {
    const book = await prisma.book.create({
      data: {
        title: bd.title,
        isbn: bd.isbn,
        description: bd.description,
        publisher: bd.publisher,
        publishYear: bd.publishYear,
        language: bd.language,
        pageCount: bd.pageCount,
        totalCopies: bd.totalCopies,
        availableCopies: bd.totalCopies,
        authors: { create: bd.authorIds.map(i => ({ authorId: authors[i].id })) },
        categories: { create: bd.categoryIds.map(i => ({ categoryId: categories[i].id })) },
      },
    });

    // Create copies for each book
    for (let i = 0; i < bd.totalCopies; i++) {
      await prisma.bookCopy.create({
        data: {
          bookId: book.id,
          barcode: `BC-${book.id.slice(-4).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          condition: ['Good', 'Very Good', 'Excellent'][i % 3],
          shelfLocation: `Shelf ${String.fromCharCode(65 + (books.length % 5))}-${Math.floor(books.length / 5) + 1}`,
          status: 'AVAILABLE',
        },
      });
    }
    books.push(book);
  }
  console.log(`${books.length} books created with copies`);

  // Create collections
  const coll1 = await prisma.collection.create({
    data: {
      name: 'Classic Literature',
      description: 'Timeless works of literary fiction',
      isPublic: true,
      books: { create: [{ bookId: books[0].id }, { bookId: books[1].id }, { bookId: books[2].id }, { bookId: books[3].id }] },
    },
  });

  const coll2 = await prisma.collection.create({
    data: {
      name: 'Fantasy & Magic',
      description: 'Magical worlds and adventures',
      isPublic: true,
      books: { create: [{ bookId: books[4].id }, { bookId: books[5].id }] },
    },
  });

  const coll3 = await prisma.collection.create({
    data: {
      name: 'Thriller & Horror',
      description: 'Edge-of-your-seat excitement',
      isPublic: true,
      books: { create: [{ bookId: books[6].id }, { bookId: books[7].id }, { bookId: books[8].id }] },
    },
  });

  console.log('3 collections created');

  // Create some sample loans
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const inOneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const threeDaysOverdue = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Get some available copies
  const copies0 = await prisma.bookCopy.findMany({ where: { bookId: books[0].id, status: 'AVAILABLE' }, take: 1 });
  const copies4 = await prisma.bookCopy.findMany({ where: { bookId: books[4].id, status: 'AVAILABLE' }, take: 1 });
  const copies3 = await prisma.bookCopy.findMany({ where: { bookId: books[3].id, status: 'AVAILABLE' }, take: 1 });

  if (copies0.length > 0 && members.length > 0) {
    await prisma.loan.create({
      data: {
        memberId: members[0].id, bookId: books[0].id, copyId: copies0[0].id,
        loanDate: twoWeeksAgo, dueDate: inOneWeek, status: 'ACTIVE',
      },
    });
    await prisma.bookCopy.update({ where: { id: copies0[0].id }, data: { status: 'BORROWED' } });
    await prisma.book.update({ where: { id: books[0].id }, data: { availableCopies: { decrement: 1 } } });
  }

  if (copies4.length > 0 && members.length > 1) {
    await prisma.loan.create({
      data: {
        memberId: members[1].id, bookId: books[4].id, copyId: copies4[0].id,
        loanDate: oneWeekAgo, dueDate: inOneWeek, status: 'ACTIVE',
      },
    });
    await prisma.bookCopy.update({ where: { id: copies4[0].id }, data: { status: 'BORROWED' } });
    await prisma.book.update({ where: { id: books[4].id }, data: { availableCopies: { decrement: 1 } } });
  }

  // Create an overdue loan
  if (copies3.length > 0 && members.length > 2) {
    const loan = await prisma.loan.create({
      data: {
        memberId: members[2].id, bookId: books[3].id, copyId: copies3[0].id,
        loanDate: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000), dueDate: threeDaysOverdue, status: 'OVERDUE',
      },
    });
    await prisma.bookCopy.update({ where: { id: copies3[0].id }, data: { status: 'BORROWED' } });
    await prisma.book.update({ where: { id: books[3].id }, data: { availableCopies: { decrement: 1 } } });

    // Create fine for overdue
    await prisma.fine.create({
      data: {
        memberId: members[2].id, loanId: loan.id, amount: 3.00,
        reason: 'Late return - 3 day(s) overdue ($1.00/day)', status: 'UNPAID',
      },
    });
  }

  console.log('Sample loans and fines created');
  console.log('\n--- DEMO ACCOUNTS ---');
  console.log('Admin:     admin@library.com / admin123');
  console.log('Librarian: librarian@library.com / lib123');
  console.log('Member:    john@example.com / member123');
  console.log('Member:    emma@example.com / member123');
  console.log('---------------------\n');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
