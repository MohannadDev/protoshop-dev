"use client";

import { Menu } from "@/lib/shopify/types";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Fragment, useState } from "react";
import Search from "./search";

export default function MobileMenu({ menu }: { menu: Menu[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMobileMenu = () => setIsOpen(!isOpen);
  const closeMobileMenu = () => setIsOpen(false);
  return (
    <>
      <button
        onClick={toggleMobileMenu}
        aria-label="Open mobile menu"
        className="flex items-center justify-center text-black transition-colors border rounded-md h-11 w-11 border-neutral-200 md:hidden dark:border-neutral-700 dark:text-white"
      >
        {isOpen ? (<XMarkIcon className="h-6" />) : (<Bars3Icon className="h-4" />)}
        
      </button>

      <Transition show={isOpen}>
        <Dialog onClose={closeMobileMenu} className="relative z-50">
          <TransitionChild
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-100 backdrop-blur-[.5px]"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100 backdrop-blur-[.5px]"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </TransitionChild>
          <TransitionChild
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-[-100%]"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-[-100%]"
          >
            <DialogPanel className="fixed top-0 bottom-0 left-0 right-0 flex flex-col w-full h-full pb-6 bg-white dark:bg-black">
              <div className="p-4">
                <button
                  className="flex items-center justify-center mb-4 text-black transition-colors border rounded-md h-11 w-11 border-neutral-200 dark:border-neutral-700 dark:text-white"
                  onClick={closeMobileMenu}
                  aria-label="Close mobile menu"
                >
                  <XMarkIcon className="h-6" />
                </button>
                <div className="w-full mb-4">
                  <Search />
                </div>
                {menu.length > 0 ? (
                  <ul className="flex flex-col w-full">
                    {menu.map((item: Menu) => (
                      <li
                        className="py-2 text-xl text-black transition-colors hover:text-neutral-500 dark:text-white"
                        key={item.title}
                      >
                        <Link
                          href={item.path}
                          prefetch={true}
                          onClick={closeMobileMenu}
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </>
  );
}