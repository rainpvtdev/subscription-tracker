import React, { useState, useEffect, useCallback } from "react";
import Faq from "../components/faq";
import { ThemeToggle } from "../components/theme-toggle";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";


export default function Landing() {
    // Image carousel configuration
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
    const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;

        onSelect();
        setScrollSnaps(emblaApi.scrollSnapList());
        emblaApi.on('select', onSelect);
        
        // Auto-play functionality
        const autoplay = setInterval(() => {
            if (emblaApi.canScrollNext()) {
                emblaApi.scrollNext();
            } else {
                emblaApi.scrollTo(0);
            }
        }, 5000); // Change image every 5 seconds

        return () => {
            clearInterval(autoplay);
            emblaApi.off('select', onSelect);
        };
    }, [emblaApi, onSelect]);

    return (
        <main className="font-sans antialiased text-gray-800 dark:text-gray-200 dark:bg-slate-900 transition-colors duration-200">

            <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800/20 transition-colors duration-200">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <i className="fas fa-wallet text-2xl text-purple-600 dark:text-purple-400 mr-2"></i>
                            <span className="text-xl font-bold text-gray-800 dark:text-white">SubTrack</span>
                        </div>
                        <nav className="hidden md:flex space-x-8">
                            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Features</a>
                            <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">How It Works</a>
                            <a href="#opensource" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Open Source</a>
                        </nav>
                        <div className="flex items-center space-x-4">
                            <ThemeToggle className="mr-2" />
                            <a href="/auth" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Log In</a>
                            <a href="/auth" className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400 text-white px-4 py-2 rounded-lg transition-colors">Sign Up Free</a>
                        </div>
                        <button className="md:hidden text-gray-600 dark:text-gray-300">
                            <i className="fas fa-bars text-2xl"></i>
                        </button>
                    </div>
                </div>
            </header>

            <section className="bg-gradient-to-br from-purple-600 to-indigo-700 dark:from-purple-700 dark:to-indigo-900 text-white py-20">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center">
                    <div className="md:w-1/2 mb-10 md:mb-0">
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-white">Take Control of Your Subscriptions</h1>
                        <p className="text-xl mb-8 text-white dark:text-gray-100">Track all your subscriptions in one place. Never pay for services you don't use. SubTrack helps you manage Netflix, Amazon Prime, Disney+ and more.</p>
                        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                            <a href="/auth" className="bg-white text-purple-600 hover:bg-gray-100 dark:hover:bg-white px-6 py-3 rounded-lg text-lg font-semibold text-center transition-colors">Get Started - It's Free</a>
                        </div>
                        <div className="mt-8 flex items-center">
                            <div className="flex -space-x-2">
                                <img src="https://randomuser.me/api/portraits/women/12.jpg" className="w-10 h-10 rounded-full border-2 border-white" alt="User" />
                                <img src="https://randomuser.me/api/portraits/men/32.jpg" className="w-10 h-10 rounded-full border-2 border-white" alt="User" />
                                <img src="https://randomuser.me/api/portraits/women/44.jpg" className="w-10 h-10 rounded-full border-2 border-white" alt="User" />
                            </div>
                            <p className="ml-4 text-white">Join <span className="font-bold">10,000+</span> users tracking their subscriptions</p>
                        </div>
                    </div>
                    <div className="md:w-1/2">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                            <div className="bg-gray-100 dark:bg-gray-700 px-6 py-3 flex items-center">
                                <div className="flex space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <div className="ml-4 text-sm text-gray-600 dark:text-gray-300">SubTrack Dashboard</div>
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Your Subscriptions</h3>
                                    <span className="text-sm text-gray-500 dark:text-gray-300">Total: $47.96/mo</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/77/Disney_Plus_logo.svg" className="w-10 h-10 object-contain" alt="Disney+" />
                                        <div className="ml-4 flex-grow">
                                            <h4 className="font-medium text-gray-800 dark:text-white">Disney+</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-300">Renews on May 28</p>
                                        </div>
                                        <span className="font-medium text-gray-800 dark:text-white">$7.99</span>
                                    </div>
                                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/6/69/Netflix_logo.svg" className="w-10 h-10 object-contain" alt="Netflix" />
                                        <div className="ml-4 flex-grow">
                                            <h4 className="font-medium text-gray-800 dark:text-white">Netflix Premium</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-300">Renews on June 2</p>
                                        </div>
                                        <span className="font-medium text-gray-800 dark:text-white">$19.99</span>
                                    </div>
                                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg" className="w-10 h-10 object-contain" alt="Amazon Prime" />
                                        <div className="ml-4 flex-grow">
                                            <h4 className="font-medium text-gray-800 dark:text-white">Amazon Prime</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-300">Renews on June 15</p>
                                        </div>
                                        <span className="font-medium text-gray-800 dark:text-white">$14.99</span>
                                    </div>
                                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" className="w-10 h-10 object-contain" alt="Spotify" />
                                        <div className="ml-4 flex-grow">
                                            <h4 className="font-medium text-gray-800 dark:text-white">Spotify Premium</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-300">Renews on June 5</p>
                                        </div>
                                        <span className="font-medium text-gray-800 dark:text-white">$9.99</span>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                                    <button className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400 text-white py-2 rounded-lg transition-colors">
                                        Add New Subscription
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">Powerful Features to Manage Your Subscriptions</h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">SubTrack provides everything you need to take control of your recurring payments</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-md card-hover transition-all">
                            <div className="feature-icon bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                <i className="fas fa-bell text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Renewal Alerts</h3>
                            <p className="text-gray-600 dark:text-gray-300">Get notified before your subscriptions renew so you can cancel unwanted services in time.</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-md card-hover transition-all">
                            <div className="feature-icon bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <i className="fas fa-chart-pie text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Spending Analytics</h3>
                            <p className="text-gray-600 dark:text-gray-300">Visualize your subscription spending with beautiful charts and identify areas to save money.</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-md card-hover transition-all">
                            <div className="feature-icon bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                <i className="fas fa-mobile-alt text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Mobile Friendly</h3>
                            <p className="text-gray-600 dark:text-gray-300">Access your subscription data anywhere with our responsive web app. Native apps coming soon.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="how-it-works" className="py-20 bg-gray-50 dark:bg-gray-800">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">How SubTrack Works</h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Start tracking your subscriptions in just a few simple steps</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center mb-12">
                        <div className="md:w-1/2 mb-8 md:mb-0">
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md inline-block">
                            <img src="/image/add-subscription.png" alt="Add subscription screen" className="rounded-lg w-full max-w-md" />   
                            </div>
                        </div>
                        <div className="md:w-1/2 md:pl-12">
                            <div className="flex items-start mb-6">
                                <div className="bg-purple-600 dark:bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1">1</div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Add Your Subscriptions</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Manually enter your services or connect your email/bank to automatically detect subscriptions. We support all major services like Netflix, Spotify, and Amazon Prime.</p>
                                </div>
                            </div>
                            <div className="flex items-start mb-6">
                                <div className="bg-purple-600 dark:bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1">2</div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Set Up Reminders</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Configure alerts for upcoming renewals. Choose email, browser, or mobile notifications based on your preference.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="bg-purple-600 dark:bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1">3</div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Track & Optimize</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Monitor your spending patterns, identify unused subscriptions, and make informed decisions about which services to keep.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-800">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">Simple, Transparent Pricing</h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Start for free and upgrade when you need more features</p>
                    </div>
                    <div className="flex justify-center">
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border-2 border-purple-500 dark:border-purple-400 transform scale-105 transition-all relative">
                            <div className="absolute top-0 right-0 bg-purple-600 dark:bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</div>
                            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Free</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-800 dark:text-white">$0</span>
                                <span className="text-gray-500 dark:text-gray-300">/forever</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center">
                                    <i className="fas fa-check text-green-500 mr-2"></i>
                                    <span className="text-gray-600 dark:text-gray-300">Track up to 5 subscriptions</span>
                                </li>
                                <li className="flex items-center">
                                    <i className="fas fa-check text-green-500 mr-2"></i>
                                    <span className="text-gray-600 dark:text-gray-300">Email renewal reminders</span>
                                </li>
                                <li className="flex items-center">
                                    <i className="fas fa-check text-green-500 mr-2"></i>
                                    <span className="text-gray-600 dark:text-gray-300">Basic spending analytics</span>
                                </li>
                                <li className="flex items-center text-gray-400 dark:text-gray-500">
                                    <i className="fas fa-times text-red-400 mr-2"></i>
                                    <span className="text-gray-600 dark:text-gray-300">Auto-sync with email/bank</span>
                                </li>
                                <li className="flex items-center text-gray-400 dark:text-gray-500">
                                    <i className="fas fa-times text-red-400 mr-2"></i>
                                    <span className="text-gray-600 dark:text-gray-300">Advanced reports</span>
                                </li>
                            </ul>
                            <button className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400 text-white py-3 rounded-lg transition-colors">Get Started</button>
                        </div>
                    </div>
                </div>
            </section> */}

            <section id="opensource" className="py-20 bg-gray-900 text-white">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 mb-10 md:mb-0">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Proudly Open Source</h2>
                            <p className="text-xl mb-8 opacity-90">SubTrack is built with transparency in mind. Our code is open for anyone to inspect, modify, and contribute to.</p>
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                <a href="https://github.com/rainpvtdev/subscription-tracker" target="_blank" className="bg-white text-gray-900 hover:bg-gray-200 px-6 py-3 rounded-lg text-lg font-semibold transition-colors">
                                    <i className="fab fa-github mr-2"></i> View on GitHub
                                </a>
                                <a href="https://github.com/rainpvtdev/subscription-tracker/blob/main/README.md" target="_blank" className="border-2 border-white hover:bg-white hover:bg-opacity-10 px-6 py-3 rounded-lg text-lg font-semibold transition-colors">
                                    Documentation
                                </a>
                            </div>
                        </div>
                        <div className="md:w-1/2 md:pl-12">
                            <div className="bg-gray-800 p-6 rounded-xl">
                                <div className="flex items-center mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="ml-4 text-sm text-gray-400">terminal</span>
                                </div>
                                <pre className="text-green-400 text-sm overflow-x-auto">
                                    <span className="text-gray-500"># Clone the repository</span>
                                    $ git clone https://github.com/rainpvtdev/subscription-tracker.git

                                    <span className="text-gray-500"># Install dependencies</span>
                                    $ npm install

                                    <span className="text-gray-500"># Start development server</span>
                                    $ npm run dev

                                </pre>
                                {/* <div className="mt-4 flex items-center text-sm text-gray-400">
                                    <i className="fas fa-star mr-2"></i>
                                    <span className="mr-4">1,240 GitHub Stars</span>
                                    <i className="fas fa-code-branch mr-2"></i>
                                    <span>85 Contributors</span>
                                </div> */}
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            <section className="py-20 gradient-bg text-white">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Take Control of Your Subscriptions?</h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">Join thousands of users who are saving money and reducing subscription clutter.</p>
                    <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <a href="/auth" className="bg-white text-purple-600 hover:bg-gray-100 dark:hover:bg-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">Get Started for Free</a>
                        {/* <a href="/demo" className="border-2 border-white hover:bg-white hover:bg-opacity-10 dark:border-gray-500 dark:hover:bg-gray-500 px-8 py-4 rounded-lg text-lg font-semibold transition-colors">Watch Demo</a> */}
                    </div>
                </div>
            </section>

            {/* <section className="py-20">
  <div className="container mx-auto px-6 max-w-4xl">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">Frequently Asked Questions</h2>
      <p className="text-xl text-gray-600 dark:text-gray-300">Have questions? We've got answers.</p>
    </div>
    <Faq
      items={[
        {
          question: "Can I self-host SubTrack?",
          answer:
            "Yes! SubTrack is open-source and provides detailed documentation for self-hosting. You can find deployment guides for Docker, Kubernetes, and bare metal servers in our GitHub repository.",
        },
      ]}
    />
  </div>
</section> */}


            <footer className="bg-gray-900 text-white pt-16 pb-8">
                <div className="container mx-auto px-6">
                
                    <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-400 mb-4 md:mb-0"> <span className="ftcptst">Crafted with passion 🤍 by <a href="https://www.raininfotech.com/" target="_blank">Rain Infotech</a></span></p>
                        <div className="flex space-x-6">
                        <span className="ftcptst lghide">All Rights Reserved 2023-
                            <script>document.write(new Date().getFullYear())</script>2025
                        </span>
                        </div>
                    </div>
                </div>
            </footer>


        </main>
    );
}
