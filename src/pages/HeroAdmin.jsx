import React, { useState, useEffect } from 'react';
import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const AdminPage = () => {
  const [heroData, setHeroData] = useState({
    title: '',
    subtitle: '',
    image: '',
  });
  const [imageFile, setImageFile] = useState(null);

  const [footerData, setFooterData] = useState({
    companyInfo: '',
    companyLinks: [],
    contactInfo: [],
    copyrightText: '',
  });

  const [aboutData, setAboutData] = useState({
    image: '',
    description: '',
    additionalDescription: '',
    mission: '',
    qualityAssurance: '',
    convenience:'',
    customerService:''
  });

  const [contactData, setContactData] = useState({
    image: '',
    address: '',
    telephone: '',
    email: '',
    businessName: '',
  });

  const [aboutImageFile, setAboutImageFile] = useState(null);
  const [contactImageFile, setContactImageFile] = useState(null);
  const [isEditingHero, setIsEditingHero] = useState(false);
  const [isEditingFooter, setIsEditingFooter] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);

  useEffect(() => {
    // Fetch data for all sections (Hero, Footer, About, Contact)
    const fetchData = async () => {
      try {
        const heroResponse = await axios.get(`${backendUrl}/api/hero`);
        setHeroData(heroResponse.data);
        const footerResponse = await axios.get(`${backendUrl}/api/footer`);
        setFooterData(footerResponse.data);
        const aboutResponse = await axios.get(`${backendUrl}/api/about`);
        setAboutData(aboutResponse.data);
        const contactResponse = await axios.get(`${backendUrl}/api/contact`);
        setContactData(contactResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleHeroSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', heroData.title);
    formData.append('subtitle', heroData.subtitle);
    if (imageFile) formData.append('image', imageFile);

    try {
      const { data } = await axios.put(`${backendUrl}/api/hero`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Hero section updated!');
      setHeroData(data);
    } catch (error) {
      console.error('Error updating hero section:', error);
    }
  };

  const handleFooterSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put(`${backendUrl}/api/footer`, footerData);
      alert('Footer updated!');
      setFooterData(data);
    } catch (error) {
      console.error('Error updating footer:', error);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const formData = { ...contactData, telephone: contactData.telephone.join(', '), email: contactData.email.join(', ') };
    try {
      const { data } = await axios.put(`${backendUrl}/api/contact`, formData);
      alert('Contact section updated!');
      setContactData(data);
    } catch (error) {
      console.error('Error updating contact section:', error);
    }
  };

  const handleAboutSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('description', aboutData.description);
    formData.append('additionalDescription', aboutData.additionalDescription);
    formData.append('mission', aboutData.mission);
    formData.append('qualityAssurance', aboutData.qualityAssurance);
    formData.append('convenience', aboutData.convenience);
    formData.append('customerService', aboutData.customerService);
    if (aboutImageFile) formData.append('image', aboutImageFile);

    try {
      const { data } = await axios.put(`${backendUrl}/api/about`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('About section updated!');
      setAboutData(data);
    } catch (error) {
      console.error('Error updating about section:', error);
    }
  };

  return (
    <div className="container p-8 mx-auto bg-gray-50">
      <h1 className="mb-10 text-3xl font-semibold text-center">Admin Panel</h1>

      {/* Hero Section */}
      <div className="p-6 mb-10 bg-white shadow-lg card rounded-xl">
        <h2 className="mb-6 text-xl font-semibold">Hero Section</h2>
        <button
          onClick={() => setIsEditingHero(!isEditingHero)}
          className="px-6 py-3 mb-6 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          {isEditingHero ? 'Cancel Editing' : 'Edit Hero Section'}
        </button>

        {isEditingHero ? (
          <form onSubmit={handleHeroSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium">Title</label>
              <input
                type="text"
                value={heroData.title || ''}
                onChange={(e) => setHeroData({ ...heroData, title: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Subtitle</label>
              <input
                type="text"
                value={heroData.subtitle || ''}
                onChange={(e) => setHeroData({ ...heroData, subtitle: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Image</label>
              <input
                type="file"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
              {heroData.image && !imageFile && (
                <img src={heroData.image} alt="Current Hero" className="h-auto max-w-full mt-2" />
              )}
            </div>

            <button type="submit" className="px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700">
              Update Hero Section
            </button>
          </form>
        ) : (
          <div className="mt-4">
            <h3 className="text-xl">{heroData.title}</h3>
            <p>{heroData.subtitle}</p>
            {heroData.image && <img src={heroData.image} alt="Current Hero" className="h-20 max-w-full mt-4" />}
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="p-6 mb-10 bg-white shadow-lg card rounded-xl">
        <h2 className="mb-6 text-xl font-semibold">Footer Section</h2>
        <button
          onClick={() => setIsEditingFooter(!isEditingFooter)}
          className="px-6 py-3 mb-6 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          {isEditingFooter ? 'Cancel Editing' : 'Edit Footer Section'}
        </button>

        {isEditingFooter ? (
          <form onSubmit={handleFooterSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium">Company Information</label>
              <input
                type="text"
                value={footerData.companyInfo || ''}
                onChange={(e) => setFooterData({ ...footerData, companyInfo: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Company Links</label>
              <input
                type="text"
                value={footerData.companyLinks.join(', ') || ''}
                onChange={(e) => setFooterData({ ...footerData, companyLinks: e.target.value.split(', ') })}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Contact Information</label>
              <input
                type="text"
                value={footerData.contactInfo.join(', ') || ''}
                onChange={(e) => setFooterData({ ...footerData, contactInfo: e.target.value.split(', ') })}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Copyright Text</label>
              <input
                type="text"
                value={footerData.copyrightText || ''}
                onChange={(e) => setFooterData({ ...footerData, copyrightText: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
            </div>

            <button type="submit" className="px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700">
              Update Footer Section
            </button>
          </form>
        ) : (
          <div>
            <p>{footerData.companyInfo}</p>
            <p>{footerData.companyLinks.join(', ')}</p>
            <p>{footerData.contactInfo.join(', ')}</p>
            <p>{footerData.copyrightText}</p>
          </div>
        )}
      </div>

      {/* About Section */}
      <div className="p-6 mb-10 bg-white shadow-lg card rounded-xl">
        <h2 className="mb-6 text-xl font-semibold">About Section</h2>
        <button
          onClick={() => setIsEditingAbout(!isEditingAbout)}
          className="px-6 py-3 mb-6 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          {isEditingAbout ? 'Cancel Editing' : 'Edit About Section'}
        </button>

        {isEditingAbout ? (
          <form onSubmit={handleAboutSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={aboutData.description || ''}
                onChange={(e) => setAboutData({ ...aboutData, description: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Additional Description</label>
              <textarea
                value={aboutData.additionalDescription || ''}
                onChange={(e) => setAboutData({ ...aboutData, additionalDescription: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Mission</label>
              <textarea
                value={aboutData.mission || ''}
                onChange={(e) => setAboutData({ ...aboutData, mission: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Quality Assurance</label>
              <textarea
                value={aboutData.qualityAssurance || ''}
                onChange={(e) => setAboutData({ ...aboutData, qualityAssurance: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Convenience</label>
              <textarea
                value={aboutData.convenience || ''}
                onChange={(e) => setAboutData({ ...aboutData, convenience: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Customer Service</label>
              <textarea
                value={aboutData.customerService || ''}
                onChange={(e) => setAboutData({ ...aboutData, customerService: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Image</label>
              <input
                type="file"
                onChange={(e) => setAboutImageFile(e.target.files[0])}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
              {aboutData.image && !aboutImageFile && (
                <img src={aboutData.image} alt="About Section" className="h-auto max-w-full mt-2" />
              )}
            </div>

            <button type="submit" className="px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700">
              Update About Section
            </button>
          </form>
        ) : (
          <div>
            <p>{aboutData.description}</p>
            <p>{aboutData.additionalDescription}</p>
            <p>{aboutData.mission}</p>
            <p>{aboutData.qualityAssurance}</p>
            <p>{aboutData.convenience}</p>
            <p>{aboutData.customerService}</p>
            {aboutData.image && <img src={aboutData.image} alt="About Section" className="h-20 max-w-full mt-4" />}
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div className="p-6 mb-10 bg-white shadow-lg card rounded-xl">
        <h2 className="mb-6 text-xl font-semibold">Contact Section</h2>
        <button
          onClick={() => setIsEditingContact(!isEditingContact)}
          className="px-6 py-3 mb-6 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          {isEditingContact ? 'Cancel Editing' : 'Edit Contact Section'}
        </button>

        {isEditingContact ? (
          <form onSubmit={handleContactSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium">Business Name</label>
              <input
                type="text"
                value={contactData.businessName || ''}
                onChange={(e) => setContactData({ ...contactData, businessName: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Address</label>
              <input
                type="text"
                value={contactData.address || ''}
                onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Telephone</label>
              <input
                type="text"
                value={contactData.telephone || ''}
                onChange={(e) => setContactData({ ...contactData, telephone: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                value={contactData.email || ''}
                onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Image</label>
              <input
                type="file"
                onChange={(e) => setContactImageFile(e.target.files[0])}
                className="w-full p-3 border rounded-lg focus:outline-none"
              />
              {contactData.image && !contactImageFile && (
                <img src={contactData.image} alt="Contact Section" className="h-auto max-w-full mt-2" />
              )}
            </div>

            <button type="submit" className="px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700">
              Update Contact Section
            </button>
          </form>
        ) : (
          <div>
            <p>{contactData.businessName}</p>
            <p>{contactData.address}</p>
            <p>{contactData.telephone}</p>
            <p>{contactData.email}</p>
            {contactData.image && <img src={contactData.image} alt="Contact Section" className="h-auto max-w-full mt-4" />}
          </div>
        )}
      </div>

     
    </div>
  );
};

export default AdminPage;
