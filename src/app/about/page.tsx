import Image from "next/image";
import { JsonLd } from "@/components/JsonLd";
import { LOGO_URL, SITE_NAME, SITE_URL } from "@/lib/schema";



export const metadata = {
  title: "درباره ما | انجمن حم",
  description:
    "انجمن حم با تأکید بر نوآوری، پرسشگری و گفت‌وگو بستری برای تبادل دانش و تجربه در زمینه‌های مختلف زندگی، علم، فناوری، هنر و کسب‌وکار فراهم کرده است.",
  alternates: {
    canonical: "https://faqhub.ir/about",
  },
  // openGraph: {
  //   title: "درباره ما | انجمن حم",
  //   description:
  //     "انجمن حم با تأکید بر نوآوری، پرسشگری و گفت‌وگو بستری برای تبادل دانش و تجربه فراهم کرده است.",
  //   url: "https://faqhub.ir/about",
  //   siteName: "انجمن حم",
  //   locale: "fa_IR",
  //   type: "website",
  //   images: [
  //     {
  //       url: "/main-logo.png",
  //       width: 1200,
  //       height: 630,
  //       alt: "لوگوی انجمن حم",
  //     },
  //   ],
  // },
  // twitter: {
  //   card: "summary_large_image",
  //   title: "درباره ما | انجمن حم",
  //   description:
  //     "پلتفرمی برای تبادل دانش، پرسش و گفت‌وگو درباره موضوعات علمی، هنری و فناوری.",
  //   images: ["/main-logo.png"],
  // },
};



export default function AboutPage() {
  const url = "https://faqhub.ir/about";

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${url}#about`,
    name: "درباره ما | انجمن حم",
    url,
    description:
      "انجمن حم با تأکید بر نوآوری، پرسشگری و گفت‌وگو بستری برای تبادل دانش و تجربه فراهم کرده است.",
    inLanguage: "fa-IR",
    image: LOGO_URL,
    mainEntity: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: LOGO_URL,
      },
      sameAs: [
        "https://www.instagram.com/rgb.irpsc",
        "https://uni.irpsc.com/teacher/paradise-supply-chain/",
      ],
    },
  };

  const Tamin = "/assets/images/tamin.jpg";

  return (
    <>
      <JsonLd data={aboutSchema} />

      <section className="mt-[60px] lg:mt-0 mx-auto px-4 lg:px-9 !font-azarMehr">
        <h1 className="font-rokh font-bold text-[24px] sm:text-[26px] md:text-[28px] lg:text-[30px] xl:text-[32px] text-center dark:text-white mt-[64px] mb-[16px]">
          درباره ما
        </h1>

        <div className="flex flex-col gap-10">
          <div className="px-5">
            <h2 className="dark:text-white text-black text-lg md:text-2xl font-bold font-rohk ">
              انجمن حم
            </h2>
            <p className="text-lightGray font-medium text-justify text-sm md:text-lg mt-5 leading-10">
              در انجمن حم، وارد دنیایی می‌شویم که دانش، تجربه و گفت‌وگو در کنار
              هم جریان دارند. این انجمن با هدف ایجاد فضایی آزاد برای پرسش و پاسخ
              در زمینه‌های مختلف زندگی، علم، فناوری، هنر، کسب‌وکار و حتی مسائل
              روزمره شکل گرفته است.
            </p>
          </div>

          <div className="dark:text-white flex flex-col md:flex-row gap-5 mb-20 w-full">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 w-full lg:w-[70%] xl:w-[85%]">
              <p className="mt-3 font-bold">چرا انجمن حم ؟</p>
              <ul className="list-disc ps-5 mt-3">
                <li>
                  هم‌افزایی دانش‌ها: در حم، افراد با تخصص‌ها و دیدگاه‌های مختلف
                  گرد هم می‌آیند تا به سؤالات یکدیگر پاسخ دهند. از تجربه‌های
                  شخصی تا تحلیل‌های علمی، همه نوع پاسخ در اینجا ارزشمند است.
                </li>
                <li>
                  تنوع موضوعی: فرقی نمی‌کند پرسش شما درباره فناوری باشد یا هنر،
                  روانشناسی، آموزش، سفر یا حتی مسائل ساده روزمره؛ در حم می‌توانید
                  هر سؤالی را مطرح کنید.
                </li>
                <li>
                  یادگیری جمعی: پاسخ‌ها از دل جامعه می‌آیند؛ یعنی ترکیبی از دانش
                  تخصصی، تجربه عملی و خلاقیت کاربران.
                </li>
                <li>
                  فضای باز و دوستانه: هدف حم این است که پرسشگری و گفت‌وگو برای
                  همه راحت باشد و هرکس بتواند با خیال آسوده به اشتراک دانش
                  بپردازد.
                </li>
              </ul>
              <p className="mt-5 md:text-lg">
                به حم بپیوندید و دنیایی از پاسخ‌ها، دیدگاه‌ها و تجربه‌های متفاوت
                را تجربه کنید. اینجا جایی است که هر سؤال، جرقه‌ای برای یادگیری و
                گفت‌وگو می‌شود.
              </p>
            </div>

            <div className=" w-full lg:w-[30%] xl:w-[15%] p-4 py-6 flex flex-col items-center justify-center bg-gray-100 rounded-2xl dark:bg-gray-800">
              <div className="w-[70%] flex justify-center">
                <Image
                  src={Tamin}
                  alt="مدیر سایت انجمن حم"
                  width={120}
                  height={120}
                  className="rounded-full w-full"
                  priority
                />
              </div>
              <div className="text-center flex flex-col gap-1 items-center justify-center mt-7">
                <a
                  href="https://uni.irpsc.com/teacher/paradise-supply-chain/"
                  className="text-blue-500 font-bold "
                >
                  هدلینگ زنجیره تامین بهشت
                </a>
                <p className="dark:text-white">مدیر سایت</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
