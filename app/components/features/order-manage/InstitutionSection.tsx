
import React from "react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import AsyncReactSelect from "react-select/async";
import AsyncCreatableSelect from "react-select/async-creatable";
import { generateShortId } from "~/utils/utils";

export const InstitutionSection = ({ state, setState, loadOptionInstitution, loadOptionDomain }: any) => {
    return (
        <section className="space-y-4">
            <h3 className="text-slate-700 font-semibold text-base border-b pb-1">
                Data Instansi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Nama Instansi</Label>
                    <AsyncReactSelect
                        value={
                            state?.institution_id
                                ? {
                                    value: state?.institution_id,
                                    label: state?.institution_name,
                                }
                                : null
                        }
                        loadOptions={loadOptionInstitution}
                        defaultOptions
                        placeholder="Cari dan Pilih Instansi"
                        onChange={(val: any) =>
                            setState({
                                ...state,
                                institution_id: val.value,
                                institution_name: val.label,
                            })
                        }
                    />
                </div>

                <div className="space-y-1">
                    <Label>Singkatan Instansi</Label>
                    <AsyncCreatableSelect
                        cacheOptions
                        defaultOptions
                        isClearable
                        placeholder="Singkatan instansi..."
                        loadOptions={loadOptionDomain}
                        value={
                            state?.institution_abbr
                                ? {
                                    value: "",
                                    label: state?.institution_abbr,
                                }
                                : null
                        }
                        onChange={(val) => {
                            setState({
                                ...state,
                                institution_abbr_id: val?.value,
                                institution_abbr: val?.label,
                                institution_domain: `kinau.id/drive/${generateShortId(12)}`,
                            });
                        }}
                        onCreateOption={(newValue) => {
                            const value = newValue.toUpperCase().replace(/\s+/g, "");
                            setState({
                                ...state,
                                institution_abbr: value,
                                institution_domain: `kinau.id/drive/${generateShortId(12)}`,
                            });
                        }}
                    />
                </div>
            </div>

            <div className="space-y-1">
                <Label>Domain Instansi</Label>
                <Input
                    readOnly
                    value={state?.institution_domain}
                    className="bg-gray-100"
                    placeholder="Generate Otomatis"
                />
            </div>
        </section>
    );
};
