'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sellingPrice: string;
  basePrice: string;
  averageRating: string;
  reviewCount: number;
  isFeatured: boolean;
  isTrending: boolean;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/products?limit=12')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">OM</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                OneMartGo
              </span>
            </Link>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="/products" className="text-gray-700 hover:text-purple-600 transition">
                Products
              </Link>
              <Link href="/categories" className="text-gray-700 hover:text-purple-600 transition">
                Categories
              </Link>
              <Link href="/reels" className="text-gray-700 hover:text-purple-600 transition">
                Reels
              </Link>
              <Link href="/reseller" className="text-gray-700 hover:text-purple-600 transition">
                Become a Reseller
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </button>
              <Link href="/auth/login" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition">
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-90"></div>
          <div className="relative z-10 text-center text-white px-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Shop, Sell & Resell
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100">
              India's Smartest B2C + B2B2C Marketplace
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products" className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition">
                Start Shopping
              </Link>
              <Link href="/reseller" className="px-8 py-4 bg-purple-800 text-white rounded-lg font-semibold hover:bg-purple-900 transition">
                Become a Reseller
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Products</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden group"
                >
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <div className="text-6xl">🛍️</div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl font-bold text-purple-600">
                        ₹{parseFloat(product.sellingPrice).toFixed(2)}
                      </span>
                      {parseFloat(product.basePrice) > parseFloat(product.sellingPrice) && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{parseFloat(product.basePrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <span className="text-yellow-500">★</span>
                      <span>{parseFloat(product.averageRating).toFixed(1)}</span>
                      <span>({product.reviewCount})</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-white">
              <div className="text-center">
                <div className="text-5xl mb-4">🛍️</div>
                <h3 className="text-xl font-bold mb-2">Shop Quality Products</h3>
                <p className="text-purple-100">Browse from thousands of verified vendors</p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">💼</div>
                <h3 className="text-xl font-bold mb-2">Become a Vendor</h3>
                <p className="text-purple-100">Sell your products to millions of customers</p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">🔗</div>
                <h3 className="text-xl font-bold mb-2">Earn as Reseller</h3>
                <p className="text-purple-100">Share product links and earn commission</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4">OneMartGo</h4>
              <p className="text-gray-400">India's smartest B2C + B2B2C marketplace</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about">About Us</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/careers">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/returns">Returns</Link></li>
                <li><Link href="/shipping">Shipping Info</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/terms">Terms of Service</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 OneMartGo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
