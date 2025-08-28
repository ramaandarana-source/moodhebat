import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Swal from 'sweetalert2';
import { GearIcon, CheckIcon, LightbulbIcon, CopyIcon, LinkIcon } from './icons';

interface HeaderTitleProps {
  isVisible: boolean;
  isGenerating: boolean;
}

const containerVariants: Variants = {
    visible: {
        opacity: 1,
        height: 'auto',
        marginBottom: '1rem',
        transition: { type: 'spring', duration: 0.5, bounce: 0 }
    },
    hidden: {
        opacity: 0,
        height: 0,
        marginBottom: '0rem',
        transition: { type: 'spring', duration: 0.5, bounce: 0 }
    }
};

const names = [
    // Indonesian Names
    "Budi Santoso", "Siti Aminah", "Eko Prasetyo", "Dewi Lestari", "Agus Wijaya", "Rina Susanti", "Joko Widodo", "Ani Yudhoyono", "Putri Lestari", "Aditya Nugraha", "Ayu Wulandari", "Rizky Maulana", "indah Permata", "Fajar Hidayat", "Maya Sari", "Hendra Gunawan", "Dian Novita", "Taufik Hidayat", "Ratna Sari Dewi", "Irfan Hakim", "Gita Gutawa", "Bambang Pamungkas", "Fitriani", "Andi Putra", "Lina Marlina", "Surya Saputra", "Wati", "Cahyo", "Lestari", "Putra", "Achmad", "Arief", "Bayu", "Candra", "Dedi", "Dimas", "Doni", "Endang", "Farah", "Guntur", "Hasan", "Iwan", "Jajang", "Kartika", "Lia", "Mega", "Nia", "Oscar", "Pratiwi", "Qori", "Rahmat", "Sari", "Tono", "Umar", "Vina", "Wawan", "Yani", "Zainal", "Alya", "Bagus", "Citra", "Dian", "Eka", "Fani", "Galih", "Hesti", "Intan", "Jefri", "Kiki", "Lulu", "Mawar", "Nita", "Oki", "Putu", "Ratih", "Sinta", "Tia", "Utami", "Vivi", "Winda", "Yuni", "Zulaikha",
    // American Names
    "James Smith", "Mary Johnson", "Robert Williams", "Patricia Brown", "John Jones", "Jennifer Garcia", "Michael Miller", "Linda Davis", "William Rodriguez", "Elizabeth Martinez", "David Hernandez", "Barbara Moore", "Richard Taylor", "Susan Anderson", "Joseph Thomas", "Jessica Jackson", "Thomas White", "Sarah Harris", "Charles Martin", "Karen Thompson", "Christopher Garcia", "Nancy Martinez", "Daniel Robinson", "Lisa Clark", "Matthew Lewis", "Betty Walker", "Anthony Hall", "Helen Allen", "Mark Young", "Sandra King", "Aaron", "Adam", "Alex", "Amanda", "Amber", "Amy", "Andrea", "Angela", "Anna", "Ashley", "Austin", "Ben", "Beth", "Bill", "Bob", "Brandon", "Brian", "Brittany", "Bruce", "Carl", "Carol", "Catherine", "Cheryl", "Chris", "Christian", "Christina", "Christine", "Cody", "Crystal", "Cynthia", "Dan", "Dana", "David", "Debra", "Denise", "Dennis", "Diana", "Diane", "Donald", "Donna", "Doris", "Douglas", "Edward", "Emily", "Eric", "Erica", "Ethan", "Eugene", "Evelyn", "Frank", "Gary", "George", "Gloria", "Grace", "Greg", "Hannah", "Heather", "Henry", "Jack", "Jacob", "James", "Jamie", "Janet", "Janice", "Jason", "Jean", "Jeff", "Jennifer", "Jerry", "Jesse", "Jessica", "Jim", "Joan", "Joe", "John", "Jonathan", "Jordan", "Jose", "Joseph", "Joshua", "Joyce", "Juan", "Judith", "Judy", "Julia", "Julie", "Justin", "Karen", "Katherine", "Kathleen", "Kathy", "Katie", "Kayla", "Keith", "Kelly", "Ken", "Kevin", "Kim", "Kimberly", "Kyle", "Larry", "Laura", "Lauren", "Lawrence", "Linda", "Lisa", "Logan", "Lori", "Louis", "Madison", "Margaret", "Maria", "Marie", "Mark", "Martha", "Mary", "Matthew", "Megan", "Melissa", "Michael", "Michelle", "Mike", "Mildred", "Nancy", "Nathan", "Nicholas", "Nicole", "Noah", "Olivia", "Pamela", "Pat", "Patricia", "Patrick", "Paul", "Peter", "Philip", "Rachel", "Ralph", "Randy", "Raymond", "Rebecca", "Regina", "Richard", "Robert", "Roger", "Ron", "Ronald", "Rose", "Roy", "Russell", "Ruth", "Ryan", "Samantha", "Samuel", "Sandra", "Sara", "Sarah", "Scott", "Sean", "Sharon", "Shirley", "Sophia", "Stephanie", "Stephen", "Steve", "Steven", "Susan", "Tammy", "Teresa", "Terry", "Theresa", "Thomas", "Tiffany", "Tim", "Timothy", "Tina", "Todd", "Tom", "Tony", "Tracy", "Tyler", "Victoria", "Vincent", "Virginia", "Walter", "Wanda", "Wayne", "William", "Willie", "Zachary"
];

const companyPrefixes = ["Cosmic", "Pixelated", "Quantum", "Galactic", "Ninja", "Wizard", "Chrono", "Dream", "Arcane", "Luminous", "Shadow", "Byte", "Mecha", "Giga", "Turbo"];
const companyMiddles = ["Pancake", "Banana", "Donut", "Pirate", "Cactus", "Wombat", "Toaster", "Penguin", "Robot", "Doodle", "Jellybean", "Noodle", "Quest", "Forge", "Nebula"];
const companySuffixes = ["Syndicate", "Collective", "Labs", "Studios", "Works", "Factory", "Guild", "Enterprises", "Co-op", "Universe"];


const generateCompanyName = () => {
    const prefix = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
    const middle = companyMiddles[Math.floor(Math.random() * companyMiddles.length)];
    if (Math.random() > 0.6) {
        const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
        return `${prefix} ${middle} ${suffix}`;
    }
    return `${prefix} ${middle}`;
};

const popupItems: { type: 'link' | 'generator'; title: string; copyValue?: string | null }[] = [
    { type: 'link', title: 'Firefox Relay', copyValue: 'https://relay.firefox.com/' },
    { type: 'link', title: 'Cloud Skills Boost', copyValue: 'https://www.cloudskillsboost.google/users/sign_up' },
    { type: 'link', title: 'Vertex AI Challenge', copyValue: 'vertex ai challenge' },
    { type: 'link', title: 'AI Google Studio', copyValue: 'AI Google Studio' },
    { type: 'generator', title: 'Sandi Generator', copyValue: null },
    { type: 'generator', title: 'Nama Random Generator', copyValue: null },
    { type: 'generator', title: 'Nama Company', copyValue: null },
];

const generatePassword = (length = 16) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        password += charset.charAt(Math.floor(Math.random() * n));
    }
    return password;
};

const getRandomName = () => {
    return names[Math.floor(Math.random() * names.length)];
};

const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.warn('Clipboard API failed, trying fallback:', err);
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (fallbackErr) {
            console.error('Fallback copy method failed:', fallbackErr);
            document.body.removeChild(textArea);
            return false;
        }
    }
};

const HackerPopupContent: React.FC = () => {
    const InfoBox: React.FC<{ item: typeof popupItems[0] }> = ({ item }) => {
        const [isCopied, setIsCopied] = useState(false);

        const handleClick = async () => {
            if (isCopied) return;

            let valueToCopy = item.copyValue ?? '';
            if (item.type === 'generator') {
                if (item.title === "Sandi Generator") valueToCopy = generatePassword();
                else if (item.title === "Nama Random Generator") valueToCopy = getRandomName();
                else if (item.title === "Nama Company") valueToCopy = generateCompanyName();
            }

            const success = await copyToClipboard(valueToCopy);
            if (success) {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } else {
                console.error("Gagal menyalin ke clipboard.");
            }
        };
        
        const isGenerator = item.type === 'generator';
        const isUrlLink = item.type === 'link' && item.copyValue?.startsWith('http');
        
        let feedbackText = item.title;
        if (isCopied) feedbackText = "Tersalin!";
        
        const isLit = isCopied && isGenerator;

        const getIcon = () => {
            if (isGenerator) {
                return <LightbulbIcon className={`w-5 h-5 mb-1 transition-colors duration-300 ${isLit ? 'text-yellow-300 drop-shadow-[0_0_5px_rgba(253,224,71,0.7)]' : 'text-slate-500'}`} />;
            }
            if (isUrlLink) {
                return <LinkIcon className="w-5 h-5 mb-1 text-slate-500" />;
            }
            if (item.type === 'link' && !isUrlLink) {
                return <CopyIcon className="w-5 h-5 mb-1 text-slate-500" />;
            }
            return null;
        }

        return (
            <div
                onClick={handleClick}
                className="p-3 w-40 h-16 flex flex-col items-center justify-center bg-slate-800/70 border border-slate-700 rounded-lg cursor-pointer transition-colors hover:bg-cyan-900/50 hover:border-cyan-700 text-center"
            >
                {getIcon()}
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={feedbackText}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className={`flex items-center justify-center gap-1 text-sm font-semibold ${isCopied ? 'text-green-400' : 'text-slate-300'}`}
                    >
                        {isCopied && <CheckIcon className="w-4 h-4" />}
                        <span>{feedbackText}</span>
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className="flex flex-wrap items-center justify-center gap-4">
            {popupItems.map((item, index) => (
                <InfoBox key={index} item={item} />
            ))}
        </div>
    );
};


export const HeaderTitle: React.FC<HeaderTitleProps> = ({ isVisible, isGenerating }) => {
  const text = "RYAD TOOLS";
  
  const togglePopup = () => {
      const swalContent = document.createElement('div');
      const root = createRoot(swalContent);
      root.render(<HackerPopupContent />);

      Swal.fire({
          html: swalContent,
          showConfirmButton: false,
          showCloseButton: false,
          width: 'auto',
          padding: '2rem',
          background: '#0f172a',
          customClass: {
              popup: 'border border-slate-700 rounded-xl',
          }
      }).then(() => {
          root.unmount();
      });
  };
  
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Gagal mengaktifkan mode layar penuh: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <motion.div
        variants={containerVariants}
        initial="visible"
        animate={isVisible ? 'visible' : 'hidden'}
        className="overflow-visible relative" 
    >
      <div className="flex items-center justify-center gap-3">
        <motion.button 
          onClick={togglePopup}
          whileTap={{ scale: 0.9 }}
          className="cursor-pointer"
          aria-label="Buka menu cepat"
        >
          <GearIcon className={`w-8 h-8 text-slate-100 ${isGenerating ? 'animate-spin-slow' : ''}`} />
        </motion.button>
        <div className="glitch-wrapper cursor-pointer" onClick={handleToggleFullscreen} title="Toggle Fullscreen">
          <h1
            className="glitch font-mono text-3xl sm:text-4xl font-bold tracking-wider"
            data-text={text}
          >
            {text}
          </h1>
        </div>
      </div>
    </motion.div>
  );
};