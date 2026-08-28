import Form from "./components/form";
import Head from "next/head";

export async function generateMetadata() {
  const url = `https://faqhub.ir/contact`;

  return {
    title: "تماس با ما | انجمن حم",
    description:
      "ما در انجمن حم و متاورس رنگ معتقدیم که توسعه این دنیای موازی و مجازی تنها با مشارکت و همفکری عمومی امکان‌پذیر است. ارتباط با انجمن متاورس ایران و دانشگاه متاورس ایران از طریق این پلتفرم به راحتی امکان‌پذیر است.",
    alternates: {
      canonical: url,
    },
    // openGraph: {
    //   type: "website",
    //   title: "تماس با ما | انجمن حم",
    //   description:
    //     "ما در انجمن حم و متاورس رنگ معتقدیم که توسعه این دنیای موازی و مجازی تنها با مشارکت و همفکری عمومی امکان‌پذیر است.",
    //   url,
    //   images: [
    //     {
    //       url: "/main-logo.png",
    //       width: 1200,
    //       height: 630,
    //       alt: "تیم متاورس رنگ",
    //     },
    //   ],
    //   locale: "fa_IR",
    // },
    // twitter: {
    //   card: "summary_large_image",
    //   site: "@rgb_irpsc",
    //   title: "تماس با ما | انجمن حم",
    //   description:
    //     "انجمن حم؛ محلی برای پرسشگری، نوآوری و ارتباط با جامعه‌ی متاورس ایران.",
    //   images: ["/main-logo.png"],
    // },
  };
}

export default async function ContactPage() {
  const url = `https://faqhub.ir/contact`;

  // ✅ Schema بهینه‌شده
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "تماس با ما | انجمن حم",
    url,
    description:
      "ما در انجمن حم و متاورس رنگ معتقدیم که توسعه این دنیای موازی و مجازی تنها با مشارکت و همفکری عمومی امکان‌پذیر است. ارتباط با انجمن متاورس ایران و دانشگاه متاورس ایران از طریق این پلتفرم به راحتی امکان‌پذیر است.",
    mainEntity: {
      "@type": "Organization",
      name: "انجمن حم",
      url: "https://faqhub.ir",
      logo: "/main-logo.png",
      address: {
        "@type": "PostalAddress",
        streetAddress: "میرداماد، 824H+JG2",
        addressLocality: "قزوین",
        addressRegion: "استان قزوین",
        addressCountry: "ایران",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+989120820120",
          contactType: "customer service",
          availableLanguage: ["fa", "en"],
          email: "info@faqhub.ir",
        },
      ],
      sameAs: [
        "https://www.instagram.com/faqhub.ir",
        "https://maps.app.goo.gl/63ayLgtcRGZEBhmf7",
      ],
    },
  };

  return (
    <>
      <Head>
        <link rel="canonical" href={url} />
      </Head>

      {/* ✅ Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactSchema),
        }}
      />

      <div className="flex" dir="rtl">
        <section className="mt-[60px] lg:mt-0">
          <section className="mx-auto px-3 lg:px-9">
            <h1 className="font-rokh font-bold text-[24px] sm:text-[26px] md:text-[28px] lg:text-[30px] xl:text-[32px] text-center dark:text-white md:mt-[64px] mb-[16px]">
              تماس با ما
            </h1>

            <div className="flex flex-col gap-10">
              <div>
                <p className="text-lightGray font-medium text-justify text-sm md:text-lg mt-5 leading-10 px-5 xl:px-20 text-center">
                  در انجمن حم، مرزهای گفتگو گشوده می‌شود و شما به دنیایی بی‌پایان
                  از پرسش و پاسخ خوش‌آمد می‌گویید. اینجا جایی است که واقعیت با
                  اندیشه و تجربه درهم می‌آمیزد و هر پرسش، آغاز یک ماجراجویی تازه
                  در مسیر دانستن است.
                </p>
              </div>
            </div>

            <div>
              <main className="overflow-x-hidden w-full bg-gray-100 dark:bg-gray-800 rounded-xl dark:text-white py-5 px-2 md:px-4 lg:p-7 mt-5 md:mt-10">
                <h2 className="lg:text-right text-lg md:text-xl text-black dark:text-white font-bold py-5 text-center">
                  فرم تماس
                </h2>
                <div className="flex-col flex gap-7 lg:flex-row w-full">
                  {/* فرم */}
                  <div className="flex flex-col gap-2 md:gap-6 w-full lg:w-1/2 justify-center">
                    <p className="lg:text-right text-darkGray dark:text-Field py-1 text-center text-sm md:text-base mt-1">
                      پیام شما می‌تواند شروع یک مکالمه سازنده باشد.
                    </p>
                    <Form />
                  </div>

                  {/* اطلاعات تماس + نقشه */}
                  <div className="flex flex-col gap-7 w-full lg:w-1/2 justify-center">
                    <div className="flex flex-col md:flex-row md:flex-wrap w-full items-center justify-between gap-6">
                      <div className="flex items-center gap-3">
                        <a
                          className="font-bold text-2xl leading-[40px] text-black dark:text-white font-rokh"
                          href="tel:09120820120"
                        >
                          ۰۹۱۲۰۸۲۰۱۲۰
                        </a>

                        <svg width="24" height="24" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path className="dark:stroke-white" d="M5.3237 18.05C6.6987 18.875 8.3487 19.3333 9.9987 19.3333C15.0404 19.3333 19.1654 15.2083 19.1654 10.1667C19.1654 5.125 15.0404 1 9.9987 1C4.95703 1 0.832031 5.125 0.832031 10.1667C0.832031 11.8167 1.29036 13.375 2.0237 14.75L1.27247 17.6393C1.07775 18.3883 1.77096 19.0651 2.51502 18.8525L5.3237 18.05Z" stroke="#17191C" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                          <path className="dark:fill-white" d="M14.125 12.7778C14.125 12.9263 14.092 13.0789 14.0217 13.2274C13.9515 13.3759 13.8606 13.5161 13.7408 13.6481C13.5384 13.8709 13.3153 14.0318 13.0633 14.1349C12.8154 14.238 12.5469 14.2916 12.2577 14.2916C11.8363 14.2916 11.386 14.1926 10.9109 13.9905C10.4358 13.7884 9.96075 13.5161 9.4898 13.1738C9.01471 12.8273 8.56441 12.4436 8.13476 12.0188C7.70925 11.5898 7.32505 11.1401 6.98216 10.6699C6.6434 10.1996 6.37074 9.72938 6.17245 9.26325C5.97415 8.793 5.875 8.34338 5.875 7.91438C5.875 7.63388 5.92457 7.36575 6.02372 7.11825C6.12287 6.86663 6.27986 6.63563 6.49881 6.42938C6.76321 6.1695 7.05239 6.04163 7.3581 6.04163C7.47377 6.04163 7.58945 6.06638 7.69273 6.11588C7.80014 6.16538 7.89516 6.23963 7.96952 6.34688L8.92795 7.69575C9.00232 7.79888 9.05602 7.89375 9.0932 7.9845C9.13038 8.07113 9.15104 8.15775 9.15104 8.23613C9.15104 8.33513 9.12212 8.43413 9.06428 8.529C9.01058 8.62388 8.93209 8.72288 8.83294 8.82188L8.51897 9.14775C8.47352 9.19313 8.45287 9.24675 8.45287 9.31275C8.45287 9.34575 8.457 9.37463 8.46526 9.40763C8.47765 9.44063 8.49005 9.46538 8.49831 9.49013C8.57267 9.62625 8.70074 9.80363 8.88251 10.0181C9.06842 10.2326 9.26671 10.4513 9.48153 10.6699C9.70462 10.8885 9.91944 11.0906 10.1384 11.2763C10.3532 11.4578 10.5309 11.5815 10.6713 11.6558C10.692 11.664 10.7168 11.6764 10.7457 11.6888C10.7787 11.7011 10.8118 11.7053 10.849 11.7053C10.9192 11.7053 10.9729 11.6805 11.0183 11.6351L11.3323 11.3258C11.4356 11.2226 11.5347 11.1443 11.6298 11.0948C11.7248 11.037 11.8198 11.0081 11.9231 11.0081C12.0016 11.0081 12.0842 11.0246 12.1751 11.0618C12.266 11.0989 12.361 11.1525 12.4643 11.2226L13.8317 12.192C13.9391 12.2663 14.0135 12.3529 14.0589 12.456C14.1002 12.5591 14.125 12.6623 14.125 12.7778Z" fill="#17191C" />
                        </svg>

                      </div>
                      <div className="flex gap-3 text-center lg:text-right">
                        <a
                          className="text-light-newColors-shades-50 dark:text-white font-medium text-[16px] md:text-[25px] leading-[32px] font-rokh"
                          href="mailto:info@faqhub.ir"
                        >
                          info@faqhub.ir
                        </a>
                        <svg className="mt-[2px]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 22 22" fill="none">
                          <path className="dark:fill-white" d="M15.582 18.7917H6.41536C3.66536 18.7917 1.83203 17.4167 1.83203 14.2084V7.79171C1.83203 4.58337 3.66536 3.20837 6.41536 3.20837H15.582C18.332 3.20837 20.1654 4.58337 20.1654 7.79171V14.2084C20.1654 17.4167 18.332 18.7917 15.582 18.7917Z" stroke="#292D32" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                          <path className="dark:fill-white" d="M15.5846 8.25L12.7155 10.5417C11.7713 11.2933 10.2221 11.2933 9.27796 10.5417L6.41797 8.25" stroke="#292D32" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                      </div>
                    </div>

                    <div className="aspect-[5/3.4]">
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d12860.972378290073!2d50.0287883!3d36.3064114!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3f8b5551db33af95%3A0xa19dc982418e7204!2sMetaRgb!5e0!3m2!1sen!2s!4v1732341818636!5m2!1sen!2s"
                        style={{ border: "0" }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="w-full h-full rounded-xl"
                        title="نقشه دفتر انجمن حم"
                      ></iframe>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </section>
        </section>
      </div>
    </>
  );
}
