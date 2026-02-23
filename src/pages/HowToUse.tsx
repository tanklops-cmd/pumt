import { useState } from 'react'
import GlassLayout from '../components/GlassLayout'

interface HelpSection {
  id: string
  title: string
  content: React.ReactNode
}

export default function HowToUse() {
  const [expandedSection, setExpandedSection] = useState<string>('getting-started')

  const sections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: (
        <div className="space-y-4 text-sm text-slate-700">
          <p>Welcome to the Prison Unit Management Tool (PUMT). This guide will help you understand how to use the application.</p>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <h4 className="font-semibold text-blue-800 mb-2">First Time Users</h4>
            <p>Before using the system, ensure you have been given access by your administrator. Contact your IT department if you cannot log in.</p>
          </div>

          <h4 className="font-semibold text-slate-900">Quick Overview</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Select a prison from the home screen</li>
            <li>Choose a unit to manage (e.g., North, South, ISU)</li>
            <li>Use the Hub pages to manage daily operations</li>
            <li>All data syncs automatically across devices</li>
          </ul>
        </div>
      )
    },
    {
      id: 'prison-selector',
      title: 'Selecting a Prison',
      content: (
        <div className="space-y-4 text-sm text-slate-700">
          <p>The first screen lets you select which prison you are working at.</p>
          
          <h4 className="font-semibold text-slate-900">Available Prisons</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Auckland</strong> - Metropolitan Auckland region</li>
            <li><strong>Waikato</strong> - Waikato region</li>
            <li><strong>Wellington</strong> - Wellington region</li>
            <li><strong>Christchurch</strong> - Canterbury region</li>
            <li><strong>Invercargill</strong> - Southern region</li>
          </ul>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
            <p className="text-amber-800">Note: Your access may be restricted to specific prisons based on your role.</p>
          </div>
        </div>
      )
    },
    {
      id: 'unit-hub',
      title: 'Unit Hub',
      content: (
        <div className="space-y-4 text-sm text-slate-700">
          <p>The Unit Hub is your main control center for managing a unit's daily operations.</p>
          
          <h4 className="font-semibold text-slate-900">Key Features</h4>
          <ul className="space-y-3 ml-2">
            <li>
              <strong className="text-slate-900">Handover Information</strong>
              <p className="ml-4">Record and view handover notes, medical alerts, people off privileges, and confinement details.</p>
            </li>
            <li>
              <strong className="text-slate-900">Muster Total</strong>
              <p className="ml-4">View the total number of prisoners in your unit and their category breakdown.</p>
            </li>
            <li>
              <strong className="text-slate-900">SCO Checklist</strong>
              <p className="ml-4">Track daily tasks that need to be completed. Check off tasks as you do them.</p>
            </li>
            <li>
              <strong className="text-slate-900">Muster Confirmation</strong>
              <p className="ml-4">Confirm unlock, random, and lockup musters with staff signatures.</p>
            </li>
            <li>
              <strong className="text-slate-900">Daily Searches</strong>
              <p className="ml-4">Generate and track random cell and facility searches.</p>
            </li>
            <li>
              <strong className="text-slate-900">Cell Alarms</strong>
              <p className="ml-4">Check and monitor cell alarm statuses throughout your shift.</p>
            </li>
            <li>
              <strong className="text-slate-900">Movement Log</strong>
              <p className="ml-4">View recent prisoner movements and location changes.</p>
            </li>
          </ul>

          <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <p className="text-green-800">Tip: Use the Print button to print handover sheets for the next shift.</p>
          </div>
        </div>
      )
    },
    {
      id: 'muster-page',
      title: 'Muster Page',
      content: (
        <div className="space-y-4 text-sm text-slate-700">
          <p>The Muster page is where you manage all prisoners in your unit.</p>
          
          <h4 className="font-semibold text-slate-900">Adding Prisoners</h4>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Click "Add prisoner" button</li>
            <li>Enter the prisoner's name, cell number, and security classification</li>
            <li>Click Save</li>
          </ol>

          <h4 className="font-semibold text-slate-900">Recording Meals</h4>
          <p className="ml-2">Check the B (Breakfast), L (Lunch), and D (Dinner) boxes to record which meals prisoners have received.</p>

          <h4 className="font-semibold text-slate-900">Managing Prisoner Details</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Click on a prisoner's name to edit their details</li>
            <li>Update security classification, job, protection status, etc.</li>
            <li>Mark induction tasks as completed</li>
          </ul>

          <h4 className="font-semibold text-slate-900">Location Tracking</h4>
          <p className="ml-2">Select prisoners and use "Set location" to record where they are (Cell, Yard, Medical, Court, Visits, etc.).</p>

          <h4 className="font-semibold text-slate-900">Moving Prisoners</h4>
          <p className="ml-2">Use "Move to unit" to transfer prisoners between units. Enter the new cell number for each prisoner.</p>

          <h4 className="font-semibold text-slate-900">Special Status Flags</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>OPs</strong> - Off Privileges</li>
            <li><strong>CCs</strong> - Cell Confinement</li>
            <li><strong>NTDB</strong> - Not to be Discharged</li>
          </ul>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <p className="text-blue-800">When enabling CCs, you will be prompted to confirm the AT RISK form has been completed.</p>
          </div>
        </div>
      )
    },
    {
      id: 'pco-hub',
      title: 'PCO Hub',
      content: (
        <div className="space-y-4 text-sm text-slate-700">
          <p>The PCO (Prisoner Custody Officer) Hub manages prisoner inductions and job assignments.</p>
          
          <h4 className="font-semibold text-slate-900">Key Features</h4>
          <ul className="space-y-3 ml-2">
            <li>
              <strong className="text-slate-900">Pending Inductions</strong>
              <p className="ml-4">View prisoners who need to be inducted. Click "Induct" to complete the process.</p>
            </li>
            <li>
              <strong className="text-slate-900">Prisoner Jobs</strong>
              <p className="ml-4">Assign and track prisoner work assignments.</p>
            </li>
            <li>
              <strong className="text-slate-900">Laundry Numbers</strong>
              <p className="ml-4">Assign laundry numbers to new prisoners.</p>
            </li>
            <li>
              <strong className="text-slate-900">Notifications</strong>
              <p className="ml-4">Receive alerts when prisoners are transferred to your unit.</p>
            </li>
          </ul>

          <h4 className="font-semibold text-slate-900">Completing an Induction</h4>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Find the prisoner in Pending Inductions</li>
            <li>Click "Induct"</li>
            <li>Add laundry number</li>
            <li>Assign to a job</li>
            <li>Save the induction</li>
          </ol>
        </div>
      )
    },
    {
      id: 'isu-hub',
      title: 'ISU (Intervention and Support Unit)',
      content: (
        <div className="space-y-4 text-sm text-slate-700">
          <p>The ISU Hub is specifically designed for managing prisoners in the Intervention and Support Unit with additional observation requirements.</p>
          
          <h4 className="font-semibold text-slate-900">Key Features</h4>
          <ul className="space-y-3 ml-2">
            <li>
              <strong className="text-slate-900">ISU Handover</strong>
              <p className="ml-4">Specialised handover notes for ISU operations.</p>
            </li>
            <li>
              <strong className="text-slate-900">ISU Muster</strong>
              <p className="ml-4">View and manage ISU prisoners.</p>
            </li>
            <li>
              <strong className="text-slate-900">Observations</strong>
              <p className="ml-4">Record and track prisoner observations at regular intervals (15, 30, or 60 minutes).</p>
            </li>
            <li>
              <strong className="text-slate-900">ISU SCO Checklist</strong>
              <p className="ml-4">Daily tasks specific to ISU operations.</p>
            </li>
            <li>
              <strong className="text-slate-900">SACRA Reminders</strong>
              <p className="ml-4">Automatic reminders for SACRA (Shared Accommodation Risk Assessment) reviews.</p>
            </li>
          </ul>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
            <p className="text-amber-800">SACRA reminders cannot be dismissed for 3 days after creation to ensure proper follow-up.</p>
          </div>
        </div>
      )
    },
    {
      id: 'observations',
      title: 'ISU Observations',
      content: (
        <div className="space-y-4 text-sm text-slate-700">
          <p>The Observations feature allows ISU staff to record and track prisoner observations at regular intervals.</p>
          
          <h4 className="font-semibold text-slate-900">Recording an Observation</h4>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Go to ISU Hub and click "Observations"</li>
            <li>Select a prisoner from the dropdown</li>
            <li>Choose the observation interval (15, 30, or 60 minutes)</li>
            <li>Enter your name in "Recorded By"</li>
            <li>Describe the prisoner's activity (e.g., Sleeping, Watching TV)</li>
            <li>Add observation notes (e.g., Alert, Calm, Restless)</li>
            <li>Click "Add Observation"</li>
          </ol>

          <h4 className="font-semibold text-slate-900">Understanding the Timer</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span> Green - More than 5 minutes remaining</li>
            <li><span className="inline-block w-3 h-3 bg-amber-500 rounded-full"></span> Amber - Less than 5 minutes remaining</li>
            <li><span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span> Red - Overdue</li>
          </ul>

          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-800">Important: Overdue observations are highlighted in red. Ensure observations are completed on time.</p>
          </div>
        </div>
      )
    },
    {
      id: 'control-hub',
      title: 'Control Hub',
      content: (
        <div className="space-y-4 text-sm text-slate-700">
          <p>The Control Hub provides an overview of all units within a prison.</p>
          
          <h4 className="font-semibold text-slate-900">Key Features</h4>
          <ul className="space-y-3 ml-2">
            <li>
              <strong className="text-slate-900">Prison Overview</strong>
              <p className="ml-4">View totals across all units in the prison.</p>
            </li>
            <li>
              <strong className="text-slate-900">Quick Access</strong>
              <p className="ml-4">Navigate quickly to any unit within the prison.</p>
            </li>
            <li>
              <strong className="text-slate-900">ISU Access</strong>
              <p className="ml-4">Direct access to ISU for prisons that have one.</p>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'unit-config',
      title: 'Unit Configuration',
      content: (
        <div className="space-y-4 text-sm text-slate-700">
          <p>The Unit Configuration page allows administrators to set up unit-specific settings.</p>
          
          <h4 className="font-semibold text-slate-900">Configuration Options</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><strong>Cells</strong> - Define cell numbers/locations in the unit</li>
            <li><strong>Facilities</strong> - Define common areas and facilities for searches</li>
            <li><strong>Daily Tasks</strong> - Customize the SCO checklist for each unit</li>
          </ul>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
            <p className="text-amber-800">Note: Only administrators have access to unit configuration. Contact your IT admin if you need changes made.</p>
          </div>
        </div>
      )
    },
    {
      id: 'data-sync',
      title: 'Data Synchronisation',
      content: (
        <div className="space-y-4 text-sm text-slate-700">
          <p>PUMT automatically syncs data across all devices in real-time.</p>
          
          <h4 className="font-semibold text-slate-900">How Sync Works</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Data is saved automatically as you make changes</li>
            <li>Changes appear on other devices within seconds</li>
            <li>You can work offline - changes sync when reconnected</li>
          </ul>

          <h4 className="font-semibold text-slate-900">Sync Status</h4>
          <p className="ml-2">Look for the sync indicator in the app. If you see a warning, check your internet connection.</p>

          <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <p className="text-green-800">All data is stored securely. Contact your administrator if you need data exported or backed up.</p>
          </div>
        </div>
      )
    },
    {
      id: 'audit-log',
      title: 'Audit Log',
      content: (
        <div className="space-y-4 text-sm text-slate-700">
          <p>The Audit Log tracks all actions taken in the system for accountability.</p>
          
          <h4 className="font-semibold text-slate-900">What's Tracked</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Prisoner additions and removals</li>
            <li>Cell changes and movements</li>
            <li>Muster confirmations</li>
            <li>Handover updates</li>
            <li>Configuration changes</li>
            <li>And more...</li>
          </ul>

          <h4 className="font-semibold text-slate-900">Accessing the Audit Log</h4>
          <p className="ml-2">Click "Audit Log" in the sidebar menu to view all recorded actions.</p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <p className="text-blue-800">The audit log is read-only and cannot be modified. This ensures accountability and traceability.</p>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      content: (
        <div className="space-y-4 text-sm text-slate-700">
          <p>Common issues and their solutions.</p>
          
          <h4 className="font-semibold text-slate-900">Can't see my unit's prisoners</h4>
          <p className="ml-2">Make sure you're on the correct prison and unit. Check the URL or use the sidebar to navigate.</p>

          <h4 className="font-semibold text-slate-900">Data not syncing</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Check your internet connection</li>
            <li>Refresh the page</li>
            <li>Try logging out and back in</li>
          </ul>

          <h4 className="font-semibold text-slate-900">Can't access a feature</h4>
          <p className="ml-2">Your user role may not have permission. Contact your administrator for access.</p>

          <h4 className="font-semibold text-slate-900">Page not loading</h4>
          <p className="ml-2">Try clearing your browser cache or using a different browser. If the problem persists, the server may be down - contact IT.</p>

          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-800">For urgent issues, contact your unit manager or IT support immediately.</p>
          </div>
        </div>
      )
    }
  ]

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? '' : id)
  }

  return (
    <GlassLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-corrections-charcoal">How to Use PUMT</h1>
          <p className="text-slate-600">A comprehensive guide to the Prison Unit Management Tool</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {sections.map((section, index) => (
            <div key={section.id} className="border-b border-slate-200 last:border-b-0">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors text-left"
              >
                <span className="font-medium text-slate-900">{index + 1}. {section.title}</span>
                <svg 
                  className={`w-5 h-5 text-slate-500 transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSection === section.id && (
                <div className="px-4 pb-4 bg-slate-50">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Need more help? Contact your unit manager or IT support.</p>
        </div>
      </div>
    </GlassLayout>
  )
}
