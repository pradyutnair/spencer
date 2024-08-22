import React from 'react';

const AboutPage = () => {
  return (
    <section className="bg-black min-h-screen flex flex-col items-center justify-center text-center ">
      <div className="max-w-screen-lg">
        <h1 className="text-6xl font-extrabold text-white mb-8">About Us</h1>
        <img
          src="/dashboard.png"
          alt="Team Image"
          className="w-full h-auto mb-8"
        />
        <p className="text-xl text-gray-300">
          We are a dedicated team committed to delivering the best products and services. Our team works tirelessly to innovate and improve our offerings to meet the needs of our customers.
        </p>
      </div>
    </section>
  );
};

export default AboutPage;