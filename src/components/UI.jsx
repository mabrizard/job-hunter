import React from 'react'

export function Spinner() {
  return <span className="spinner" />
}

export function Tag({ children, variant = 'gray' }) {
  const styles = {
    gray:        'bg-[#F1EFE8] text-[#444441]',
    purple:      'bg-[#EEEDFE] text-[#3C3489]',
    green:       'bg-[#EAF3DE] text-[#27500A]',
    amber:       'bg-[#FAEEDA] text-[#633806]',
    red:         'bg-[#FCEBEB] text-[#501313]',
    blue:        'bg-[#E6F1FB] text-[#0C447C]',
    go:          'bg-[#EAF3DE] text-[#27500A]',
    nogo:        'bg-[#FCEBEB] text-[#501313]',
    investigate: 'bg-[#FAEEDA] text-[#633806]',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${styles[variant] || styles.gray}`}>
      {children}
    </span>
  )
}

export function ScoreBadge({ score, size = 'md' }) {
  const color = score >= 70
    ? 'bg-[#EAF3DE] text-[#27500A]'
    : score >= 45
    ? 'bg-[#FAEEDA] text-[#633806]'
    : 'bg-[#FCEBEB] text-[#501313]'
  const dim = size === 'lg' ? 'w-14 h-14 text-lg' : 'w-7 h-7 text-[11px]'
  return (
    <span className={`inline-flex items-center justify-center rounded-full font-medium ${color} ${dim}`}>
      {score}
    </span>
  )
}

export function Card({ children, className = '', highlight = false }) {
  return (
    <div className={`bg-white border ${highlight ? 'border-[#534AB7]' : 'border-gray-200'} rounded-xl p-5 ${className}`}>
      {children}
    </div>
  )
}

export function Alert({ children, variant = 'info' }) {
  const styles = {
    info:    'bg-[#E6F1FB] text-[#0C447C]',
    warning: 'bg-[#FAEEDA] text-[#633806]',
    success: 'bg-[#EAF3DE] text-[#27500A]',
    danger:  'bg-[#FCEBEB] text-[#501313]',
  }
  const icons = { info: 'ti-info-circle', warning: 'ti-alert-triangle', success: 'ti-check', danger: 'ti-x' }
  return (
    <div className={`flex items-start gap-2 px-3.5 py-2.5 rounded-lg text-[13px] ${styles[variant]}`}>
      <i className={`ti ${icons[variant]} text-base mt-0.5 flex-shrink-0`} />
      <div>{children}</div>
    </div>
  )
}

export function Button({ children, onClick, disabled, variant = 'default', size = 'md', className = '' }) {
  const base = 'inline-flex items-center gap-1.5 rounded-lg font-medium cursor-pointer transition-all border font-sans'
  const sizes = { md: 'px-3.5 py-[7px] text-[13px]', sm: 'px-2.5 py-1 text-[12px]' }
  const variants = {
    default:  'bg-white border-gray-300 text-gray-800 hover:bg-gray-50',
    primary:  'bg-[#534AB7] border-[#534AB7] text-white hover:bg-[#3C3489] hover:border-[#3C3489]',
    danger:   'bg-white border-red-200 text-red-600 hover:bg-red-50',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  )
}

export function Input({ label, ...props }) {
  return (
    <div>
      {label && <div className="text-[12px] text-gray-500 font-medium mb-1">{label}</div>}
      <input
        className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-[#534AB7] transition-colors"
        {...props}
      />
    </div>
  )
}

export function Textarea({ label, ...props }) {
  return (
    <div>
      {label && <div className="text-[12px] text-gray-500 font-medium mb-1">{label}</div>}
      <textarea
        className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-[#534AB7] transition-colors resize-y"
        {...props}
      />
    </div>
  )
}

export function Select({ label, children, ...props }) {
  return (
    <div>
      {label && <div className="text-[12px] text-gray-500 font-medium mb-1">{label}</div>}
      <select
        className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-[#534AB7] transition-colors"
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

export function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-[18px] font-medium text-gray-900">{title}</h2>
      {subtitle && <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

export function DimBar({ name, score }) {
  const color = score >= 70 ? '#639922' : score >= 40 ? '#BA7517' : '#E24B4A'
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="text-[12px] text-gray-500 w-36 flex-shrink-0">{name}</div>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full dim-bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <div className="text-[12px] font-medium w-7 text-right" style={{ color }}>{score}</div>
    </div>
  )
}

export function OutputBox({ id, children, editable = false }) {
  return (
    <div
      id={id}
      contentEditable={editable}
      suppressContentEditableWarning
      className={`text-[13px] leading-relaxed whitespace-pre-wrap rounded-lg p-4 ${
        editable ? 'bg-white border border-gray-200 outline-none focus:border-[#534AB7]' : 'bg-gray-50'
      }`}
    >
      {children}
    </div>
  )
}
