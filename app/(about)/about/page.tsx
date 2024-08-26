import React from 'react';

const AboutPage = () => {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-black text-center ">
      <div className="max-w-screen-lg">
        <h1 className="mb-8 text-6xl font-extrabold text-white">About Us</h1>
        <img
          src="/dashboard.png"
          alt="Team Image"
          className="mb-8 h-auto w-full"
        />
        <p className="text-xl text-gray-300">
          We are a dedicated team committed to delivering the best products and
          services. Our team works tirelessly to innovate and improve our
          offerings to meet the needs of our customers.
        </p>
      </div>
    </section>
  );
};

export default AboutPage;