'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="relative w-full bg-background border-t border-border py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-2xl font-bold mb-4 font-grotesk">Ninah</h3>
            <p className="text-sm text-muted-foreground font-poppins">Private payments for the modern era</p>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground font-grotesk">Products</h4>
            <ul className="space-y-2 font-poppins">
              <li>
                <a href="/wallet" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Wallet
                </a>
              </li>
              <li>
                <a href="/payments" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Payments
                </a>
              </li>
              <li>
                <a href="/receive" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Receive
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground font-grotesk">Resources</h4>
            <ul className="space-y-2 font-poppins">
              <li>
                <a href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/api" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="/community" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Community
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground font-grotesk">Legal</h4>
            <ul className="space-y-2 font-poppins">
              <li>
                <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground font-poppins">
            © {new Date().getFullYear()} Ninah. All rights reserved. Built with privacy in mind.
          </p>
        </div>
      </div>
    </footer>
  );
}
