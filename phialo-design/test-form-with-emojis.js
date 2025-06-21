// Test contact form submission with emojis
const testContactForm = async () => {
  const formData = {
    access_key: '29a8504e-2d7e-44e2-8ec3-feaec6a03503',
    name: 'Test User 🌟',
    email: 'bdedersen@vogel.yoga',
    phone: '+49 123 456789',
    message: 'Hallo! Dies ist eine Test-Nachricht mit schönen Emojis 🌟✨🎨💎🦢\n\nIch hoffe, diese Nachricht kommt gut an! 😊',
    subject: 'Test-Nachricht mit Emojis 🎨',
    botcheck: '' // honeypot field
  };

  try {
    console.log('Sending test email with emojis to bdedersen@vogel.yoga...');
    
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    
    if (response.status === 200) {
      console.log('✅ Success! Message sent with emojis');
      console.log('Response:', result);
    } else {
      console.log('❌ Error:', response.status);
      console.log('Response:', result);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

// Run the test
testContactForm();